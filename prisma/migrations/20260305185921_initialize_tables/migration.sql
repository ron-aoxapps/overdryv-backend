-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subdomain" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "subscription_plan" TEXT NOT NULL DEFAULT 'starter',
    "payment_model" TEXT NOT NULL DEFAULT 'dual_pricing',
    "status" TEXT DEFAULT 'trial',
    "billing_email" TEXT NOT NULL,
    "phone" TEXT,
    "address" JSONB,
    "trial_ends_at" TIMESTAMPTZ(6),
    "subscription_starts_at" TIMESTAMPTZ(6),
    "subscription_ends_at" TIMESTAMPTZ(6),
    "next_billing_date" TIMESTAMPTZ(6),
    "settings" JSONB DEFAULT '{"branding": {"logo_url": null, "primary_color": "#2563eb", "secondary_color": "#1e293b"}, "notifications": {"sms_enabled": true, "email_enabled": true}, "business_hours": {"friday": {"open": "08:00", "close": "18:00"}, "monday": {"open": "08:00", "close": "18:00"}, "sunday": {"closed": true}, "tuesday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "16:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}}}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "monthly_price" DECIMAL(10,2),
    "user_limit" INTEGER,
    "subscription_status" TEXT DEFAULT 'onboarding',
    "onboarding_completed_at" TIMESTAMPTZ(6),
    "first_billing_date" TIMESTAMPTZ(6),
    "is_founder" BOOLEAN NOT NULL DEFAULT false,
    "current_user_count" INTEGER NOT NULL DEFAULT 1,
    "current_customer_count" INTEGER NOT NULL DEFAULT 0,
    "current_work_orders_total" INTEGER NOT NULL DEFAULT 0,
    "current_storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "addon_quickbooks_async" BOOLEAN NOT NULL DEFAULT false,
    "addon_partstech" BOOLEAN NOT NULL DEFAULT false,
    "addon_digits_ai" TEXT,
    "addon_honkamp_payroll" BOOLEAN NOT NULL DEFAULT false,
    "payment_gateway" TEXT DEFAULT 'dejavoo',
    "dejavoo_merchant_id" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" DECIMAL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationFeature" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "feature_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB DEFAULT '{}',
    "enabled_at" TIMESTAMPTZ(6),
    "disabled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationIntegration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "integration_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "credentials" JSONB,
    "config" JSONB DEFAULT '{}',
    "status" TEXT DEFAULT 'disabled',
    "last_synced_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "error_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "OrganizationIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "feature_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "enabled_by" UUID,
    "enabled_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureAuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "feature_key" TEXT,
    "integration_key" TEXT,
    "action" TEXT NOT NULL,
    "changed_by" UUID,
    "changed_by_name" TEXT,
    "previous_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bay" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "vin" TEXT,
    "make" TEXT ,
    "model" TEXT ,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "mileage" INTEGER ,
    "license_plate" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_number" TEXT NOT NULL,
    "customer_id" UUID,
    "vehicle_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "service_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_completion" TIMESTAMPTZ(6),
    "total_amount" DECIMAL(10,2) DEFAULT 0,
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "valid_until" TIMESTAMPTZ(6) DEFAULT now() + '30 days'::interval,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_to_work_order_id" UUID,
    "organization_id" UUID NOT NULL,
    "number" TEXT,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_number" TEXT NOT NULL,
    "customer_id" UUID,
    "vehicle_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "service_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_completion" TIMESTAMPTZ(6),
    "actual_completion" TIMESTAMPTZ(6),
    "technician_id" UUID,
    "total_amount" DECIMAL(10,2) DEFAULT 0,
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "number" TEXT,
    "bay_id" UUID,
    "scheduled_start" DATE,
    "scheduled_end" DATE,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_id" UUID,
    "work_order_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) DEFAULT 1,
    "unit_price" DECIMAL(10,2) DEFAULT 0,
    "total_price" DECIMAL(10,2) DEFAULT 0,
    "item_type" TEXT NOT NULL DEFAULT 'labor',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_order_id" UUID,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waiver" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "work_order_id" UUID,
    "signature_data" TEXT NOT NULL,
    "ip_address" INET,
    "signed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "waiver_text" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "Waiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "part_number" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "unit_cost" DECIMAL DEFAULT 0,
    "retail_price" DECIMAL DEFAULT 0,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "maximum_stock" INTEGER,
    "location" TEXT,
    "supplier" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) DEFAULT 0,
    "amount_due" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invoice_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "line_items" JSONB DEFAULT '[]',
    "payment_method_id" UUID,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "work_order_id" UUID,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "gateway_customer_id" TEXT NOT NULL,
    "gateway_payment_method_id" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "last_four" TEXT NOT NULL,
    "exp_month" INTEGER NOT NULL,
    "exp_year" INTEGER NOT NULL,
    "cardholder_name" TEXT,
    "is_default" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID,
    "gateway_transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "transaction_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_method_id" UUID,
    "card_last_four" TEXT,
    "payment_model" TEXT,
    "base_amount" DECIMAL(10,2),
    "fee_amount" DECIMAL(10,2),
    "discount_amount" DECIMAL(10,2),
    "gateway_response" JSONB,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianSetting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "display_color" TEXT NOT NULL DEFAULT '#3b82f6',
    "display_initials" TEXT NOT NULL,
    "hourly_rate" DECIMAL DEFAULT 0,
    "specialties" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "previous_plan" TEXT,
    "new_plan" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_amount" DECIMAL(10,2),
    "new_amount" DECIMAL(10,2),
    "effective_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyTarget" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "revenue_target" DECIMAL(12,2) DEFAULT 0,
    "jobs_target" INTEGER DEFAULT 0,
    "avg_ticket_target" DECIMAL(10,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "period" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSequence" (
    "organization_id" UUID NOT NULL,
    "work_order_seq" BIGINT NOT NULL DEFAULT 0,
    "estimate_seq" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantSequence_pkey" PRIMARY KEY ("organization_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_subdomain_key" ON "Organization"("subdomain");

-- CreateIndex
CREATE INDEX "Organization_subscription_plan_idx" ON "Organization"("subscription_plan");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_subdomain_idx" ON "Organization"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_organization_id_idx" ON "Profile"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_organization_id_email_key" ON "Profile"("organization_id", "email");

-- CreateIndex
CREATE INDEX "OrganizationMember_organization_id_idx" ON "OrganizationMember"("organization_id");

-- CreateIndex
CREATE INDEX "OrganizationMember_user_id_idx" ON "OrganizationMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organization_id_user_id_key" ON "OrganizationMember"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "OrganizationFeature_organization_id_idx" ON "OrganizationFeature"("organization_id");

-- CreateIndex
CREATE INDEX "OrganizationFeature_feature_key_idx" ON "OrganizationFeature"("feature_key");

-- CreateIndex
CREATE INDEX "OrganizationFeature_organization_id_enabled_idx" ON "OrganizationFeature"("organization_id", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationFeature_organization_id_feature_key_key" ON "OrganizationFeature"("organization_id", "feature_key");

-- CreateIndex
CREATE INDEX "OrganizationIntegration_organization_id_idx" ON "OrganizationIntegration"("organization_id");

-- CreateIndex
CREATE INDEX "OrganizationIntegration_integration_key_idx" ON "OrganizationIntegration"("integration_key");

-- CreateIndex
CREATE INDEX "OrganizationIntegration_status_idx" ON "OrganizationIntegration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationIntegration_organization_id_integration_key_key" ON "OrganizationIntegration"("organization_id", "integration_key");

-- CreateIndex
CREATE INDEX "FeatureFlag_organization_id_idx" ON "FeatureFlag"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_organization_id_feature_key_key" ON "FeatureFlag"("organization_id", "feature_key");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_organization_id_idx" ON "FeatureAuditLog"("organization_id");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_action_idx" ON "FeatureAuditLog"("action");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_created_at_idx" ON "FeatureAuditLog"("created_at" DESC);

-- CreateIndex
CREATE INDEX "FeatureAuditLog_changed_by_idx" ON "FeatureAuditLog"("changed_by");

-- CreateIndex
CREATE INDEX "Bay_organization_id_idx" ON "Bay"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_customer_id_idx" ON "Vehicle"("customer_id");

-- CreateIndex
CREATE INDEX "Vehicle_organization_id_idx" ON "Vehicle"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organization_id_vin_key" ON "Vehicle"("organization_id", "vin");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_estimate_number_key" ON "Estimate"("estimate_number");

-- CreateIndex
CREATE INDEX "Estimate_customer_id_idx" ON "Estimate"("customer_id");

-- CreateIndex
CREATE INDEX "Estimate_vehicle_id_idx" ON "Estimate"("vehicle_id");

-- CreateIndex
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");

-- CreateIndex
CREATE INDEX "Estimate_organization_id_idx" ON "Estimate"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_organization_id_number_key" ON "Estimate"("organization_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_work_order_number_key" ON "WorkOrder"("work_order_number");

-- CreateIndex
CREATE INDEX "WorkOrder_customer_id_idx" ON "WorkOrder"("customer_id");

-- CreateIndex
CREATE INDEX "WorkOrder_vehicle_id_idx" ON "WorkOrder"("vehicle_id");

-- CreateIndex
CREATE INDEX "WorkOrder_technician_id_idx" ON "WorkOrder"("technician_id");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_organization_id_idx" ON "WorkOrder"("organization_id");

-- CreateIndex
CREATE INDEX "WorkOrder_bay_id_idx" ON "WorkOrder"("bay_id");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduled_start_idx" ON "WorkOrder"("scheduled_start");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_organization_id_number_key" ON "WorkOrder"("organization_id", "number");

-- CreateIndex
CREATE INDEX "ServiceItem_estimate_id_idx" ON "ServiceItem"("estimate_id");

-- CreateIndex
CREATE INDEX "ServiceItem_work_order_id_idx" ON "ServiceItem"("work_order_id");

-- CreateIndex
CREATE INDEX "ServiceItem_organization_id_idx" ON "ServiceItem"("organization_id");

-- CreateIndex
CREATE INDEX "Photo_work_order_id_idx" ON "Photo"("work_order_id");

-- CreateIndex
CREATE INDEX "Photo_organization_id_idx" ON "Photo"("organization_id");

-- CreateIndex
CREATE INDEX "Waiver_organization_id_idx" ON "Waiver"("organization_id");

-- CreateIndex
CREATE INDEX "Waiver_work_order_id_idx" ON "Waiver"("work_order_id");

-- CreateIndex
CREATE INDEX "Part_organization_id_idx" ON "Part"("organization_id");

-- CreateIndex
CREATE INDEX "Part_organization_id_category_idx" ON "Part"("organization_id", "category");

-- CreateIndex
CREATE INDEX "Part_organization_id_part_number_idx" ON "Part"("organization_id", "part_number");

-- CreateIndex
CREATE INDEX "Part_organization_id_quantity_on_hand_minimum_stock_idx" ON "Part"("organization_id", "quantity_on_hand", "minimum_stock");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");

-- CreateIndex
CREATE INDEX "Invoice_organization_id_idx" ON "Invoice"("organization_id");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_due_date_idx" ON "Invoice"("due_date");

-- CreateIndex
CREATE INDEX "PaymentMethod_organization_id_idx" ON "PaymentMethod"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_gateway_transaction_id_key" ON "Transaction"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "Transaction_organization_id_idx" ON "Transaction"("organization_id");

-- CreateIndex
CREATE INDEX "Transaction_invoice_id_idx" ON "Transaction"("invoice_id");

-- CreateIndex
CREATE INDEX "Transaction_gateway_transaction_id_idx" ON "Transaction"("gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianSetting_profile_id_key" ON "TechnicianSetting"("profile_id");

-- CreateIndex
CREATE INDEX "TechnicianSetting_organization_id_idx" ON "TechnicianSetting"("organization_id");

-- CreateIndex
CREATE INDEX "TechnicianSetting_profile_id_idx" ON "TechnicianSetting"("profile_id");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_organization_id_idx" ON "SubscriptionHistory"("organization_id");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_effective_date_idx" ON "SubscriptionHistory"("effective_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTarget_organization_id_month_year_key" ON "MonthlyTarget"("organization_id", "month", "year");

-- CreateIndex
CREATE INDEX "UsageTracking_organization_id_period_idx" ON "UsageTracking"("organization_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTracking_organization_id_metric_period_key" ON "UsageTracking"("organization_id", "metric", "period");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationFeature" ADD CONSTRAINT "OrganizationFeature_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationIntegration" ADD CONSTRAINT "OrganizationIntegration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureAuditLog" ADD CONSTRAINT "FeatureAuditLog_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bay" ADD CONSTRAINT "Bay_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_converted_to_work_order_id_fkey" FOREIGN KEY ("converted_to_work_order_id") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_bay_id_fkey" FOREIGN KEY ("bay_id") REFERENCES "Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waiver" ADD CONSTRAINT "Waiver_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waiver" ADD CONSTRAINT "Waiver_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waiver" ADD CONSTRAINT "Waiver_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSetting" ADD CONSTRAINT "TechnicianSetting_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSetting" ADD CONSTRAINT "TechnicianSetting_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTarget" ADD CONSTRAINT "MonthlyTarget_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageTracking" ADD CONSTRAINT "UsageTracking_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSequence" ADD CONSTRAINT "TenantSequence_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
