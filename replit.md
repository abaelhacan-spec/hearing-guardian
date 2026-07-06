# Hearing Guardian

تطبيق Android احترافي لحماية السمع ومراقبة استخدام سماعات الأذن — يعمل تلقائياً ويتتبع وقت الاستماع الحقيقي.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo SDK (latest stable) + React Native + Kotlin Native Module

## Where things live

- Mobile app: `artifacts/hearing-guardian/` — Expo app
- Native Module: `artifacts/hearing-guardian/modules/audio-monitor/` — Kotlin event bridge
- DB schema: `lib/db/src/schema/index.ts`
- API contract: `lib/api-spec/openapi.yaml`

## Architecture decisions

- Kotlin is a pure Event Engine — only listens to Android OS events and forwards them to React Native. Zero app logic in Kotlin.
- All app logic (timer, notifications, stats, settings) lives in React Native/TypeScript.
- Expo Modules API used for Native Module (not legacy React Native Modules) — better EAS Build integration.
- AsyncStorage for settings, SQLite for historical statistics.
- Zustand for state management — lightweight and appropriate for this app size.

## Product

- Tracks real listening time (headset connected AND audio playing simultaneously)
- Sends break reminder notifications after configurable interval (default 60 min)
- Supports Bluetooth and wired headsets — any audio output device
- Statistics: today / this week / this month listening durations
- Settings: alert interval, break duration, notification toggle, theme, language

## User preferences

### قواعد إلزامية طوال عمر المشروع

1. **Expo SDK** — استخدم أحدث إصدار مستقر متوافق مع جميع المكتبات.
2. **توافق المكتبات** — قبل إضافة أي مكتبة: تحقق من توافقها مع Expo SDK + React Native + React.
3. **لا مكتبات Deprecated** — ولا مكتبات غير مدعومة.
4. **Native Modules** — يجب التأكد من التوافق مع EAS Build و Expo Development Build.
5. **تثبيت المكتبات** — استخدم `npx expo install` دائماً، يمنع `npm install` المباشر.
6. **الملفات الأساسية** — لا يُعدَّل أي منها إلا عند الضرورة مع شرح سبب التعديل:
   - `app.json`, `app.config.js/ts`, `package.json`, `eas.json`
   - `babel.config.js`, `metro.config.js`, `tsconfig.json`, `plugins/`
7. **Expo Plugins** — لا تُضاف إلا إذا كانت المكتبة تتطلبها رسمياً.
8. **package.json نظيف** — لا dependencies غير مستخدمة، لا نسختين من نفس المكتبة، لا نسخ قديمة.
9. **Expo Doctor** — يُشغَّل بشكل دوري للتأكد من سلامة المشروع.
10. **معيار اكتمال أي مهمة** — يجب المرور بدون أخطاء في: TypeScript + Expo Doctor + Metro Bundler.
11. **استقرار البناء** — الهدف صفر أخطاء في ملفات الإعداد وتعارض الإصدارات. استقرار البناء أولوية مساوية لجودة الكود.
12. **البناء المستهدف** — Android + EAS Build يجب أن يعملا في جميع مراحل التطوير.

## Gotchas

- `AudioPlayback` monitoring does not require `RECORD_AUDIO` — we detect playback state, not record audio.
- Foreground Service required for background tracking when screen is locked.
- `BLUETOOTH_CONNECT` permission required for Android API 31+.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile app conventions
