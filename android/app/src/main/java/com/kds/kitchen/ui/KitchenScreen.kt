package com.kds.kitchen.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Kitchen
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.kds.kitchen.ui.theme.*
import com.kds.kitchen.viewmodel.KitchenViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KitchenScreen(
    viewModel   : KitchenViewModel = viewModel(),
    onNewTicket : () -> Unit = {},
) {
    val orders       by viewModel.orders.collectAsState()
    val alertPending by viewModel.newTicketAlert.collectAsState()

    // Trigger SoundPool chime via callback to MainActivity
    LaunchedEffect(alertPending) {
        if (alertPending) {
            onNewTicket()
            viewModel.onAlertConsumed()
        }
    }

    val pendingCount   = orders.count { it.status == "pending" }
    val preparingCount = orders.count { it.status == "preparing" }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector        = Icons.Default.Kitchen,
                            contentDescription = null,
                            tint               = KdsPrimary,
                            modifier           = Modifier.size(26.dp),
                        )
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(
                                text       = "Kitchen Display System",
                                style      = MaterialTheme.typography.titleLarge,
                                fontSize   = 18.sp,
                                color      = KdsTextPrimary,
                            )
                            Text(
                                text     = "Live Order Feed",
                                fontSize = 12.sp,
                                color    = KdsTextMuted,
                            )
                        }
                    }
                },
                actions = {
                    // Status count chips in the top bar
                    StatusChip(label = "PENDING",   count = pendingCount,   color = StatusPending)
                    Spacer(Modifier.width(8.dp))
                    StatusChip(label = "PREPARING", count = preparingCount, color = StatusPreparing)
                    Spacer(Modifier.width(16.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = KdsSurface2,
                    titleContentColor = KdsTextPrimary,
                ),
            )
        },
        containerColor = KdsBg,
    ) { paddingValues ->

        if (orders.isEmpty()) {
            // Empty state
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text       = "No Active Orders",
                        style      = MaterialTheme.typography.headlineMedium,
                        color      = KdsTextSecondary,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text      = "Waiting for new tickets...",
                        fontSize  = 15.sp,
                        color     = KdsTextMuted,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        } else {
            // Ticket grid — 2 columns on tablet, 1 on phone
            LazyVerticalGrid(
                columns            = GridCells.Adaptive(minSize = 340.dp),
                modifier           = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding     = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement   = Arrangement.spacedBy(16.dp),
            ) {
                items(
                    items = orders,
                    key   = { it.id },
                ) { order ->
                    AnimatedVisibility(
                        visible = true,
                        enter   = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                        exit    = slideOutHorizontally(targetOffsetX = { it }) + fadeOut(),
                    ) {
                        TicketCard(
                            order          = order,
                            onStatusChange = { newStatus ->
                                viewModel.updateStatus(order.id, newStatus)
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusChip(label: String, count: Int, color: androidx.compose.ui.graphics.Color) {
    Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(99.dp),
        color = color.copy(alpha = 0.12f),
    ) {
        Text(
            text     = "$count $label",
            color    = color,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp,
        )
    }
}
