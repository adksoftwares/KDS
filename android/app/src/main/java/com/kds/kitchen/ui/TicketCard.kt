package com.kds.kitchen.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kds.kitchen.data.Order
import com.kds.kitchen.ui.theme.*
import java.util.Date
import kotlin.math.abs

@Composable
fun TicketCard(
    order: Order,
    onStatusChange: (String) -> Unit,
) {
    val isPending    = order.status == "pending"
    val isPreparing  = order.status == "preparing"

    // ── Animated card border color based on status ────────────────────────────
    val borderColor by animateColorAsState(
        targetValue = when {
            isPending   -> StatusPending
            isPreparing -> StatusPreparing
            else        -> KdsBorder
        },
        animationSpec = tween(durationMillis = 400),
        label         = "borderColor",
    )
    val cardBg = if (isPending) PendingCardBg else PreparingCardBg

    // ── Swipe-to-complete state (for preparing tickets) ───────────────────────
    var swipeDelta by remember { mutableFloatStateOf(0f) }
    val swipeThreshold = 200f   // px required to trigger completion

    val swipeModifier = if (isPreparing) {
        Modifier.pointerInput(order.id) {
            detectHorizontalDragGestures(
                onDragEnd   = {
                    if (swipeDelta > swipeThreshold) {
                        onStatusChange("completed")
                    }
                    swipeDelta = 0f
                },
                onDragCancel = { swipeDelta = 0f },
            ) { _, dragAmount ->
                if (dragAmount > 0) swipeDelta += dragAmount  // right swipe only
            }
        }
    } else Modifier

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(swipeModifier)
            .border(
                width = 2.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp),
            ),
        shape  = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            // ── Header ────────────────────────────────────────────────────────
            TicketHeader(order = order, borderColor = borderColor)

            HorizontalDivider(color = KdsBorder, thickness = 1.dp)

            // ── Items ─────────────────────────────────────────────────────────
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                order.items.forEach { item ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment     = Alignment.Top,
                    ) {
                        // Quantity badge
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(borderColor.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text       = "${item.quantity}×",
                                color      = borderColor,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize   = 14.sp,
                            )
                        }
                        Column {
                            Text(
                                text       = item.name,
                                style      = MaterialTheme.typography.titleMedium,
                                color      = KdsTextPrimary,
                            )
                            if (item.notes.isNotBlank()) {
                                Spacer(Modifier.height(4.dp))
                                // Notes in red — high-visibility for allergens
                                Text(
                                    text       = "⚠ ${item.notes}",
                                    color      = StatusDanger,
                                    fontWeight = FontWeight.Bold,
                                    fontSize   = 13.sp,
                                )
                            }
                        }
                    }
                }
            }

            HorizontalDivider(color = KdsBorder, thickness = 1.dp)

            // ── Action Footer ─────────────────────────────────────────────────
            TicketActionFooter(
                order          = order,
                isPending      = isPending,
                isPreparing    = isPreparing,
                borderColor    = borderColor,
                onStatusChange = onStatusChange,
            )
        }
    }
}

@Composable
private fun TicketHeader(order: Order, borderColor: Color) {
    val ageMinutes = remember(order.created_at) {
        order.created_at?.let {
            val diff = System.currentTimeMillis() - it.seconds * 1000
            (diff / 60_000).toInt()
        } ?: 0
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment     = Alignment.CenterVertically,
    ) {
        Text(
            text       = order.table_id.replace('_', ' ').uppercase(),
            style      = MaterialTheme.typography.titleLarge,
            color      = KdsTextPrimary,
        )

        Row(
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Age indicator — turns red when > 10 minutes
            val ageColor = if (ageMinutes >= 10) StatusDanger else KdsTextMuted
            Text(
                text  = if (ageMinutes < 1) "Just now" else "${ageMinutes}m ago",
                color = ageColor,
                fontWeight = if (ageMinutes >= 10) FontWeight.Bold else FontWeight.Normal,
                fontSize   = 13.sp,
            )

            // Status badge
            Surface(
                shape = RoundedCornerShape(99.dp),
                color = borderColor.copy(alpha = 0.15f),
            ) {
                Text(
                    text     = order.status.uppercase(),
                    color    = borderColor,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                )
            }
        }
    }
}

@Composable
private fun TicketActionFooter(
    order         : Order,
    isPending     : Boolean,
    isPreparing   : Boolean,
    borderColor   : Color,
    onStatusChange: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (isPending) {
            // ── Fat-finger "Start" button ────────────────────────────────────
            Button(
                onClick  = { onStatusChange("preparing") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape  = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = StatusPending),
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                Spacer(Modifier.width(8.dp))
                Text("START PREPARING", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
        }

        if (isPreparing) {
            // ── Fat-finger "Complete" button ─────────────────────────────────
            Button(
                onClick  = { onStatusChange("completed") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape  = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = StatusReady),
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.Black)
                Spacer(Modifier.width(8.dp))
                Text("MARK COMPLETE", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
        }
    }
}
