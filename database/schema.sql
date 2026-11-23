-- Gişe Web — database schema (SQLite)
-- Generated from the EF Core migration "InitialCreate" with:
--     cd src/Gise.Web && dotnet ef migrations script -o ../../database/schema.sql
-- The application applies this migration automatically on start-up, so running this file is optional.
-- Manual setup:   sqlite3 src/Gise.Web/gise.db < database/schema.sql
-- Demo data (users, events, orders, tickets) is inserted by src/Gise.Web/Data/DbSeeder.cs on the first run.

CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);

BEGIN TRANSACTION;
CREATE TABLE "AuditLogs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY AUTOINCREMENT,
    "ActorId" INTEGER NULL,
    "ActorName" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "Detail" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

CREATE TABLE "Users" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY AUTOINCREMENT,
    "FullName" TEXT NOT NULL,
    "Username" TEXT COLLATE NOCASE NOT NULL,
    "Email" TEXT COLLATE NOCASE NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Role" INTEGER NOT NULL,
    "OrganizationName" TEXT NULL,
    "RemindersEnabled" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "BannedAt" TEXT NULL,
    "BannedUntil" TEXT NULL,
    "BanReason" TEXT NULL,
    "BanNote" TEXT NULL
);

CREATE TABLE "Events" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Events" PRIMARY KEY AUTOINCREMENT,
    "Title" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Tags" TEXT NULL,
    "Venue" TEXT NOT NULL,
    "District" TEXT NOT NULL,
    "City" TEXT NOT NULL,
    "StartsAt" TEXT NOT NULL,
    "DoorsAt" TEXT NOT NULL,
    "AgeLimit" TEXT NOT NULL,
    "CoverImage" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "OrganizerId" INTEGER NOT NULL,
    CONSTRAINT "FK_Events_Users_OrganizerId" FOREIGN KEY ("OrganizerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Orders" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Orders" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "EventId" INTEGER NOT NULL,
    "Status" INTEGER NOT NULL,
    "Total" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "ExpiresAt" TEXT NULL,
    "PaidAt" TEXT NULL,
    "CardLast4" TEXT NULL,
    CONSTRAINT "FK_Orders_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Orders_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "TicketTiers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_TicketTiers" PRIMARY KEY AUTOINCREMENT,
    "EventId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NULL,
    "Price" INTEGER NOT NULL,
    "Capacity" INTEGER NOT NULL,
    "Sold" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    CONSTRAINT "CK_Tier_Sold" CHECK (Sold >= 0 AND Sold <= Capacity),
    CONSTRAINT "FK_TicketTiers_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE CASCADE
);

CREATE TABLE "OrderItems" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OrderItems" PRIMARY KEY AUTOINCREMENT,
    "OrderId" INTEGER NOT NULL,
    "TierId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "UnitPrice" INTEGER NOT NULL,
    CONSTRAINT "FK_OrderItems_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OrderItems_TicketTiers_TierId" FOREIGN KEY ("TierId") REFERENCES "TicketTiers" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Tickets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Tickets" PRIMARY KEY AUTOINCREMENT,
    "OrderId" INTEGER NOT NULL,
    "TierId" INTEGER NOT NULL,
    "Code" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "IssuedAt" TEXT NOT NULL,
    "RedeemedAt" TEXT NULL,
    "CancelledAt" TEXT NULL,
    CONSTRAINT "FK_Tickets_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Tickets_TicketTiers_TierId" FOREIGN KEY ("TierId") REFERENCES "TicketTiers" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_AuditLogs_CreatedAt" ON "AuditLogs" ("CreatedAt");

CREATE INDEX "IX_Events_Category" ON "Events" ("Category");

CREATE INDEX "IX_Events_OrganizerId" ON "Events" ("OrganizerId");

CREATE INDEX "IX_Events_Status_StartsAt" ON "Events" ("Status", "StartsAt");

CREATE INDEX "IX_OrderItems_OrderId" ON "OrderItems" ("OrderId");

CREATE INDEX "IX_OrderItems_TierId" ON "OrderItems" ("TierId");

CREATE UNIQUE INDEX "IX_Orders_Code" ON "Orders" ("Code");

CREATE INDEX "IX_Orders_EventId" ON "Orders" ("EventId");

CREATE INDEX "IX_Orders_Status_ExpiresAt" ON "Orders" ("Status", "ExpiresAt");

CREATE INDEX "IX_Orders_UserId" ON "Orders" ("UserId");

CREATE UNIQUE INDEX "IX_Tickets_Code" ON "Tickets" ("Code");

CREATE INDEX "IX_Tickets_OrderId" ON "Tickets" ("OrderId");

CREATE INDEX "IX_Tickets_TierId" ON "Tickets" ("TierId");

CREATE INDEX "IX_TicketTiers_EventId" ON "TicketTiers" ("EventId");

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261123121025_InitialCreate', '10.0.15');

COMMIT;

