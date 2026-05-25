# Phase 12: Suscripciones y carrito v2 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 12-suscripciones-y-carrito-v2
**Areas discussed:** Flujo de pago de suscripción

---

## Selección de áreas

| Área | Seleccionada |
|------|-------------|
| Flujo de pago de suscripción | ✓ |
| Ciclos y renovación | — |
| Créditos en el carrito | — |
| Alcance de suscripción | — |

Las tres áreas no seleccionadas fueron resueltas mediante el Design Brief (`docs/DESIGN-BRIEF.md`)
que el usuario tenía abierto — las reglas de negocio son explícitas en las secciones §1, §3.12
y §3.13.

---

## Flujo de pago de suscripción

### Q1: ¿Cómo se inicia el pago?

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Orden especial | Crea una Order con ítem SUBSCRIPTION, reutiliza GatewayFactory | ✓ |
| Endpoint propio sin Order | POST /subscriptions/pay directo, duplica lógica | |

**Decisión:** Orden especial — reutiliza toda la lógica existente de PaymentGateway.

---

### Q2: ¿Qué endpoint maneja el callback de Transbank?

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Endpoint dedicado /subscriptions/confirm | Activa plan, registra ciclo, copia créditos | ✓ |
| Reusar /payments/confirm con tipo | Un solo endpoint con bifurcación de lógica | |

**Decisión:** Endpoint dedicado — separación clara de responsabilidades.

---

### Q3: ¿Qué pasa si Transbank rechaza el pago?

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| No se crea la suscripción | Solo existe tras confirmación exitosa | ✓ |
| Suscripción en PENDING | Se crea en PENDING y se activa/elimina según callback | |

**Decisión:** No se crea — simplifica el estado; el usuario reintenta si es necesario.

---

### Q4: ¿Qué pasa con suscripción duplicada?

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Bloquear con 409 Conflict | Schema tiene @unique; usuario debe cancelar primero | ✓ |
| Reemplazar automáticamente | Cancela anterior y crea nueva | |

**Decisión:** 409 Conflict — explícito y predecible; el usuario controla cuándo cancela.

---

## Claude's Discretion

- Estructura interna del SubscriptionsModule
- Si agregar OrderItemType.SUBSCRIPTION al enum o usar Order sin items
- Implementación del cálculo "días hasta fecha del evento" para créditos
- Nombre y ubicación del método que aplica crédito al carrito
- Si crear SubscriptionCreditLog para historial de créditos usados

## Deferred Ideas

- Renovación automática via cron — Phase 14 o posterior
- Reembolsos de suscripción — fuera de scope v2
