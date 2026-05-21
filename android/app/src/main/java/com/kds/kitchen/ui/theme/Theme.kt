package com.kds.kitchen.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val KdsDarkColorScheme = darkColorScheme(
    primary         = KdsPrimary,
    onPrimary       = KdsTextPrimary,
    background      = KdsBg,
    onBackground    = KdsTextPrimary,
    surface         = KdsSurface,
    onSurface       = KdsTextPrimary,
    surfaceVariant  = KdsSurface2,
    onSurfaceVariant= KdsTextSecondary,
    outline         = KdsBorder,
    error           = StatusDanger,
    onError         = KdsTextPrimary,
)

private val KdsTypography = Typography(
    // Ticket item names — large, readable at a distance
    headlineMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize   = 20.sp,
        lineHeight = 26.sp,
        color      = KdsTextPrimary,
    ),
    // Table identifiers
    titleLarge = TextStyle(
        fontWeight = FontWeight.ExtraBold,
        fontSize   = 22.sp,
        letterSpacing = 1.sp,
        color      = KdsTextPrimary,
    ),
    // Quantity × item
    titleMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize   = 18.sp,
        color      = KdsTextPrimary,
    ),
    // Notes / timestamps
    bodySmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize   = 13.sp,
        color      = KdsTextMuted,
    ),
    // Buttons
    labelLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize   = 16.sp,
        letterSpacing = 0.5.sp,
    ),
)

@Composable
fun KdsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = KdsDarkColorScheme,
        typography  = KdsTypography,
        content     = content,
    )
}
