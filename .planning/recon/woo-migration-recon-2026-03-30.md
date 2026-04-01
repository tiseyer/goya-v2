# WooCommerce/WordPress Migration Recon Report

**Date:** 2026-03-30
**Supabase Project:** `snddprncgilpctgvjukr`
**Branch:** `develop`

---

## 1. Profiles Table Schema

### WP/Woo-relevante Felder

| Feld | Typ | Vorhanden? |
|------|-----|-----------|
| `stripe_customer_id` | text | Ja - aber **0 befuellt** |
| `wp_roles` | jsonb | Ja - **5.802 von 5.802** befuellt |
| `wp_registered_at` | timestamptz | Ja - **5.796 von 5.802** befuellt |
| `requires_password_reset` | boolean | Ja - **5.799 = true** |
| `wp_user_id` | - | **Existiert NICHT** |
| `woo_customer_id` | - | **Existiert NICHT** |

### Alle Felder (54 Spalten)

**Identitaet:** `id` (uuid), `email`, `full_name`, `first_name`, `last_name`, `username`, `mrn`
**Profil:** `avatar_url`, `bio`, `location`, `city`, `country`, `phone`, `website`
**Social:** `instagram`, `youtube`, `facebook`, `tiktok`, `youtube_intro_url`
**Rollen/Status:** `role` (enum), `subscription_status`, `member_type`, `verification_status`, `is_verified`
**Onboarding:** `onboarding_completed`, `onboarding_step`
**Teacher-spezifisch:** `teacher_status`, `teaching_styles[]`, `teaching_focus_arr[]`, `influences_arr[]`, `certificate_is_official`, `certificate_url`, `other_org_member`, `other_org_names[]`, `other_org_name_other`, `other_org_registration`, `other_org_designations`
**Wellness-spezifisch:** `wellness_designations[]`, `wellness_designation_other`, `wellness_org_name`, `wellness_regulatory_body`, `wellness_regulatory_designations`, `wellness_focus[]`
**Sonstiges:** `practice_format`, `languages[]`, `designations[]`, `theme_preference`
**Stripe/WP:** `stripe_customer_id`, `wp_roles` (jsonb), `wp_registered_at`
**Meta:** `created_at`, `updated_at`, `requires_password_reset`

---

## 2. Zahlen-Uebersicht

### Gesamt
| Metrik | Wert |
|--------|------|
| **Total Profiles** | **5.802** |
| Onboarding abgeschlossen | 2 |
| Password-Reset erforderlich | 5.799 |
| Mit WP-Registrierungsdatum | 5.796 |
| Mit WP-Roles gesetzt | 5.802 |

### Rollen (`role` enum)
| Rolle | Anzahl | % |
|-------|--------|---|
| teacher | 3.470 | 59,8% |
| student | 2.318 | 40,0% |
| admin | 14 | 0,2% |
| wellness_practitioner | 0 | 0% |
| moderator | 0 | 0% |

> **Hinweis:** `wellness_practitioner` und `moderator` existieren als Enum-Werte, sind aber nicht vergeben. Die 361 WP-Wellness-Practitioners wurden offenbar als `teacher` oder `student` gemappt.

### Subscription Status
| Status | Anzahl | % |
|--------|--------|---|
| member | 4.823 | 83,1% |
| guest | 979 | 16,9% |

### Stripe-Integration
| Metrik | Wert |
|--------|------|
| Mit `stripe_customer_id` | **0** |

**Stripe ist noch nicht verbunden.** Kein einziger User hat eine Stripe Customer ID.

---

## 3. WordPress-Rollen Analyse (`wp_roles` jsonb)

### Faux-User (Test/Fake-Accounts aus WP)
| Typ | Anzahl |
|-----|--------|
| **faux** (in wp_roles) | **3.494** (60,2%) |
| **robit** (in wp_roles) | **0** |

> **Kritisch:** 3.494 von 5.802 Profilen (60%) sind `faux` User! Das sind Test-/Fake-Accounts aus der WP-Migration.

### WooCommerce Customer-Rolle
| Typ | Anzahl |
|-----|--------|
| `customer` in wp_roles | **870** (15,0%) |

### Top WP-Rollen-Kombinationen
| wp_roles | Anzahl |
|----------|--------|
| `[teacher, faux, subscriber]` | 2.767 |
| `[student, bbp_participant, subscriber]` | 631 |
| `[wellness_practitioner, faux, subscriber]` | 361 |
| `[student, faux, subscriber]` | 349 |
| `[teacher, subscriber, bbp_participant]` | 207 |
| `[customer, student, bbp_participant]` | 190 |
| `[teacher, bbp_participant, subscriber]` | 153 |
| `[teacher, subscriber]` | 121 |
| `[customer, teacher, bbp_participant]` | 119 |
| `[teacher, customer]` | 94 |

---

## 4. Sample-Daten

### Aktive Members (ohne Faux)
| Email | Name | Role | Status | WP Roles | WP Reg. |
|-------|------|------|--------|----------|---------|
| alessandra.turone@gmail.com | Alessandra Turone | teacher | member | [teacher, subscriber] | 2023-12-02 |
| bevward731@gmail.com | Beverly Ward | student | member | [student, subscriber] | 2024-05-12 |
| emma.johnson@test.goya.com | Emma Johnson | student | member | [] | - |

### Guest Users
| Email | Name | Role | Status | WP Roles | WP Reg. |
|-------|------|------|--------|----------|---------|
| chaneckie@ruchawellness.com | Chaneckie Black | student | guest | [bbp_participant, customer, wellness_practitioner] | 2024-01-30 |
| tleevans13@gmail.com | Tanisleigh Evans | student | guest | [student, subscriber, bbp_participant] | 2024-01-30 |

### Faux Users (Test/Fake)
| Email | Name | Role | Status | WP Roles | WP Reg. |
|-------|------|------|--------|----------|---------|
| justin.moore73@gmail.com | Justin Moore | teacher | member | [teacher, faux, subscriber] | 2024-06-18 |
| emily.stevens8@gmail.com | Emily Stevens | teacher | member | [teacher, faux, subscriber] | 2024-06-18 |
| janice.hayes74@live.com | Janice Hayes | teacher | member | [teacher, faux, subscriber] | 2024-06-18 |

---

## 5. Key Takeaways

### Was wurde migriert?
- Alle 5.802 WP-User wurden als Supabase Profiles importiert
- WP-Rollen wurden in `wp_roles` (jsonb) gespeichert
- WP-Registrierungsdatum in `wp_registered_at`
- `requires_password_reset = true` fuer fast alle (muessen neues PW setzen)
- Rollenkonvertierung: WP-Rollen -> Supabase `role` enum (teacher/student/admin)

### Was fehlt?
- **Keine `wp_user_id`** - kein Rueck-Mapping zu WordPress moeglich
- **Keine `woo_customer_id`** - kein WooCommerce-Mapping
- **Stripe: 0 verknuepft** - Stripe-Integration steht noch komplett aus
- **Onboarding: 2 von 5.802** - fast niemand hat das Onboarding durchlaufen
- **Wellness Practitioners:** 361 im WP, aber 0 in Supabase `role` (wurden als teacher/student importiert)

### Datenqualitaet-Warnung
- **60% Faux-User:** 3.494 Profile sind Fake/Test-Daten aus WP
- Echte User: ca. **2.308** (5.802 - 3.494 faux)
- Davon 870 mit WooCommerce `customer` Rolle (potenzielle Stripe-Kunden)
- Faux-User haben subscription_status = `member`, sind aber keine echten Members

### Empfehlung
1. **Faux-User bereinigen** bevor Stripe-Integration - sonst werden 3.494 Fake-Profile als zahlende Members behandelt
2. **Wellness Practitioner Rolle** korrekt mappen (361 User betroffen)
3. **Stripe Customer IDs** muessen noch komplett zugeordnet werden (via WooCommerce-Export oder Stripe API Lookup ueber Email)
4. **wp_user_id** nachtraeglich importieren falls WP-Datenbank noch verfuegbar (fuer Audit-Trail)
