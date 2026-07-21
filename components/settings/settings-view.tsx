"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { ReferenceListEditor } from "@/components/settings/reference-list-editor";
import { StatusListEditor } from "@/components/settings/status-list-editor";
import { PaymentStatusEditor } from "@/components/settings/payment-status-editor";
import { DataManagement } from "@/components/settings/data-management";
import { ProfitPlanEditor } from "@/components/settings/profit-plan-editor";
import type { User, Source, ServiceType, ProjectStatus, PaymentStatus, ProfitPlan } from "@/lib/db/schema";

interface Props {
  user: Omit<User, "passwordHash">;
  sources: Source[];
  serviceTypes: ServiceType[];
  projectStatuses: ProjectStatus[];
  paymentStatuses: PaymentStatus[];
  profitPlans: ProfitPlan[];
  profitPlanYear: number;
}

export function SettingsView({
  user,
  sources,
  serviceTypes,
  projectStatuses,
  paymentStatuses,
  profitPlans,
  profitPlanYear,
}: Props) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-ink)]">Настройки</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Профиль, справочники и управление данными</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="references">Услуги и источники</TabsTrigger>
          <TabsTrigger value="statuses">Статусы</TabsTrigger>
          <TabsTrigger value="plan">План</TabsTrigger>
          <TabsTrigger value="data">Данные</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="pt-5">
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-5">
              <ReferenceListEditor
                title="Источники клиентов"
                description="Откуда приходят ваши клиенты и заказы"
                apiPath="/api/settings/sources"
                items={sources}
                onChanged={refresh}
              />
              <div className="h-px bg-[var(--color-border)]" />
              <ReferenceListEditor
                title="Типы услуг"
                description="Какие услуги вы предоставляете"
                apiPath="/api/settings/service-types"
                items={serviceTypes}
                onChanged={refresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-5">
              <StatusListEditor statuses={projectStatuses} onChanged={refresh} />
              <div className="h-px bg-[var(--color-border)]" />
              <PaymentStatusEditor statuses={paymentStatuses} onChanged={refresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardContent className="pt-5">
              <ProfitPlanEditor initialPlans={profitPlans} initialYear={profitPlanYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardContent className="pt-5">
              <DataManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
