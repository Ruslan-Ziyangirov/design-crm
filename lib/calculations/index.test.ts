import { describe, it, expect } from "vitest";
import {
  calcProfit,
  calcRemainder,
  calcMargin,
  calcAverageCheck,
  calcChangePercent,
  isOverdue,
  isExcludedFromRevenue,
  aggregateOrders,
  distributionBy,
  findBestMonths,
  trendDirection,
  type OrderForCalc,
} from "./index";

function makeOrder(overrides: Partial<OrderForCalc> = {}): OrderForCalc {
  return {
    id: crypto.randomUUID(),
    statusId: "status-done",
    price: 100000,
    paymentReceived: 100000,
    expenses: 20000,
    statusCategory: "done",
    deadline: null,
    createdAt: new Date("2026-01-15"),
    completedDate: new Date("2026-01-20"),
    startDate: new Date("2026-01-10"),
    clientId: "client-1",
    serviceTypeId: "service-1",
    sourceId: "source-1",
    ...overrides,
  };
}

describe("calcProfit", () => {
  it("считает прибыль как оплату минус расходы", () => {
    expect(calcProfit({ price: 0, paymentReceived: 100000, expenses: 30000 })).toBe(70000);
  });

  it("допускает отрицательную прибыль, если расходы больше оплаты", () => {
    expect(calcProfit({ price: 0, paymentReceived: 10000, expenses: 25000 })).toBe(-15000);
  });
});

describe("calcRemainder", () => {
  it("считает остаток как стоимость минус оплата", () => {
    expect(calcRemainder({ price: 100000, paymentReceived: 40000, expenses: 0 })).toBe(60000);
  });

  it("возвращает 0, если оплачено полностью", () => {
    expect(calcRemainder({ price: 50000, paymentReceived: 50000, expenses: 0 })).toBe(0);
  });
});

describe("calcMargin", () => {
  it("считает маржинальность в процентах", () => {
    expect(calcMargin(100000, 30000)).toBe(30);
  });

  it("возвращает 0 при нулевой выручке", () => {
    expect(calcMargin(0, 0)).toBe(0);
  });
});

describe("calcAverageCheck", () => {
  it("делит выручку на количество заказов", () => {
    expect(calcAverageCheck(300000, 3)).toBe(100000);
  });

  it("возвращает 0 при отсутствии заказов", () => {
    expect(calcAverageCheck(0, 0)).toBe(0);
  });
});

describe("calcChangePercent", () => {
  it("считает рост в процентах", () => {
    expect(calcChangePercent(120, 100)).toBe(20);
  });

  it("считает падение в процентах", () => {
    expect(calcChangePercent(80, 100)).toBe(-20);
  });

  it("возвращает null, если оба периода нулевые", () => {
    expect(calcChangePercent(0, 0)).toBeNull();
  });

  it("возвращает 100%, если рост с нуля", () => {
    expect(calcChangePercent(50, 0)).toBe(100);
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-07-19");

  it("активный проект с прошедшим дедлайном — просрочен", () => {
    const order = makeOrder({ statusCategory: "active", deadline: new Date("2026-07-01") });
    expect(isOverdue(order, now)).toBe(true);
  });

  it("проект без дедлайна не считается просроченным", () => {
    const order = makeOrder({ statusCategory: "active", deadline: null });
    expect(isOverdue(order, now)).toBe(false);
  });

  it("завершённый проект с прошедшим дедлайном не считается просроченным", () => {
    const order = makeOrder({ statusCategory: "done", deadline: new Date("2026-07-01") });
    expect(isOverdue(order, now)).toBe(false);
  });

  it("проект с будущим дедлайном не просрочен", () => {
    const order = makeOrder({ statusCategory: "active", deadline: new Date("2026-08-01") });
    expect(isOverdue(order, now)).toBe(false);
  });
});

describe("isExcludedFromRevenue", () => {
  it("отменённые заказы исключаются", () => {
    expect(isExcludedFromRevenue({ statusCategory: "cancelled" })).toBe(true);
  });

  it("прочие заказы не исключаются", () => {
    expect(isExcludedFromRevenue({ statusCategory: "active" })).toBe(false);
    expect(isExcludedFromRevenue({ statusCategory: "done" })).toBe(false);
  });
});

describe("aggregateOrders", () => {
  it("считает агрегаты и исключает отменённые заказы из выручки/прибыли", () => {
    const orders = [
      makeOrder({ price: 100000, paymentReceived: 100000, expenses: 20000, statusCategory: "done" }),
      makeOrder({ price: 50000, paymentReceived: 50000, expenses: 10000, statusCategory: "done" }),
      makeOrder({ price: 200000, paymentReceived: 0, expenses: 5000, statusCategory: "cancelled" }),
    ];
    const result = aggregateOrders(orders);
    expect(result.revenue).toBe(150000);
    expect(result.expenses).toBe(30000);
    expect(result.profit).toBe(120000);
    expect(result.orderCount).toBe(2);
    expect(result.averageCheck).toBe(75000);
    expect(result.margin).toBe(80);
  });

  it("считает задолженность (остаток) только по неотменённым заказам", () => {
    const orders = [
      makeOrder({ price: 100000, paymentReceived: 40000, expenses: 0, statusCategory: "active" }),
      makeOrder({ price: 200000, paymentReceived: 0, expenses: 0, statusCategory: "cancelled" }),
    ];
    const result = aggregateOrders(orders);
    expect(result.outstanding).toBe(60000);
  });

  it("возвращает нули для пустого списка", () => {
    const result = aggregateOrders([]);
    expect(result.revenue).toBe(0);
    expect(result.orderCount).toBe(0);
    expect(result.margin).toBe(0);
  });
});

describe("distributionBy", () => {
  it("группирует заказы по источнику и считает выручку", () => {
    const orders = [
      makeOrder({ sourceId: "telegram", paymentReceived: 50000 }),
      makeOrder({ sourceId: "telegram", paymentReceived: 30000 }),
      makeOrder({ sourceId: "instagram", paymentReceived: 20000 }),
    ];
    const result = distributionBy(orders, (o) => o.sourceId);
    expect(result["telegram"].count).toBe(2);
    expect(result["telegram"].revenue).toBe(80000);
    expect(result["instagram"].count).toBe(1);
  });

  it("исключает отменённые заказы из распределения", () => {
    const orders = [
      makeOrder({ sourceId: "telegram", statusCategory: "cancelled" }),
      makeOrder({ sourceId: "telegram", statusCategory: "done" }),
    ];
    const result = distributionBy(orders, (o) => o.sourceId);
    expect(result["telegram"].count).toBe(1);
  });
});

describe("findBestMonths", () => {
  it("находит месяцы-лидеры по выручке, прибыли, числу заказов и среднему чеку", () => {
    const buckets = [
      {
        key: "2026-01",
        label: "Январь 2026",
        newClients: 2,
        financials: { revenue: 100000, expenses: 20000, profit: 80000, orderCount: 2, averageCheck: 50000, margin: 80, outstanding: 0 },
      },
      {
        key: "2026-02",
        label: "Февраль 2026",
        newClients: 5,
        financials: { revenue: 300000, expenses: 250000, profit: 50000, orderCount: 5, averageCheck: 60000, margin: 16.67, outstanding: 0 },
      },
    ];
    const best = findBestMonths(buckets);
    expect(best?.byRevenue.key).toBe("2026-02");
    expect(best?.byProfit.key).toBe("2026-01");
    expect(best?.byOrderCount.key).toBe("2026-02");
    expect(best?.byAvgCheck.key).toBe("2026-02");
  });

  it("возвращает null для пустого набора месяцев", () => {
    expect(findBestMonths([])).toBeNull();
  });
});

describe("trendDirection", () => {
  it("возвращает up при положительном изменении", () => {
    expect(trendDirection(15)).toBe("up");
  });
  it("возвращает down при отрицательном изменении", () => {
    expect(trendDirection(-5)).toBe("down");
  });
  it("возвращает flat при отсутствии данных", () => {
    expect(trendDirection(null)).toBe("flat");
  });
});
