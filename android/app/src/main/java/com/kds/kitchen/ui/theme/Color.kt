package com.kds.kitchen.ui.theme

import androidx.compose.ui.graphics.Color

// ── Background ────────────────────────────────────────────────────────────────
val KdsBg         = Color(0xFF000000)   // Pure black — max contrast, glare reduction
val KdsSurface    = Color(0xFF111111)   // Ticket card background
val KdsSurface2   = Color(0xFF1A1A1A)  // Elevated surface (header bars)
val KdsBorder     = Color(0xFF2A2A2A)  // Subtle dividers

// ── Text ──────────────────────────────────────────────────────────────────────
val KdsTextPrimary   = Color(0xFFFFFFFF)  // Main labels — pure white
val KdsTextSecondary = Color(0xFFAAAAAA)  // Sub-labels
val KdsTextMuted     = Color(0xFF666666)  // Timestamps, hints

// ── Order Status — HIGH CONTRAST, SOLID ───────────────────────────────────────
val StatusPending    = Color(0xFFF59E0B)  // Amber  — "New Ticket"
val StatusPreparing  = Color(0xFF3B82F6)  // Blue   — "Being Worked On"
val StatusReady      = Color(0xFF10B981)  // Green  — "Done"
val StatusDanger     = Color(0xFFEF4444)  // Red    — errors, allergen notes

// ── Status card tints ─────────────────────────────────────────────────────────
val PendingCardBg    = Color(0xFF1A1400)  // Dark amber tint
val PendingBorder    = Color(0xFF78490A)  // Amber border
val PreparingCardBg  = Color(0xFF020B1A)  // Dark blue tint
val PreparingBorder  = Color(0xFF1D4ED8)  // Blue border

// ── Brand ─────────────────────────────────────────────────────────────────────
val KdsPrimary       = Color(0xFF3B82F6)  // Blue as accent for KDS
