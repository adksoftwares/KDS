package com.kds.kitchen.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kds.kitchen.data.FirestoreOrderRepository
import com.kds.kitchen.data.Order
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class KitchenViewModel : ViewModel() {

    private val repository = FirestoreOrderRepository()

    // ── Order Stream ──────────────────────────────────────────────────────────
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    // ── New Ticket Alert ──────────────────────────────────────────────────────
    // Emits true for one collection cycle whenever a new pending ticket arrives.
    private val _newTicketAlert = MutableStateFlow(false)
    val newTicketAlert: StateFlow<Boolean> = _newTicketAlert.asStateFlow()

    private var previousPendingIds = setOf<String>()

    init {
        viewModelScope.launch {
            repository.observeActiveOrders().collect { newOrders ->
                val currentPendingIds = newOrders
                    .filter { it.status == "pending" }
                    .map { it.id }
                    .toSet()

                // Check if any pending IDs are brand new
                if (currentPendingIds.any { it !in previousPendingIds }) {
                    _newTicketAlert.value = true
                }
                previousPendingIds = currentPendingIds
                _orders.value = newOrders
            }
        }
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    /**
     * Single tap: pending → preparing
     * Tap on "Complete" button: preparing → completed
     */
    fun updateStatus(orderId: String, newStatus: String) {
        repository.updateStatus(orderId, newStatus)
    }

    /** Called by MainActivity after SoundPool has played the chime. */
    fun onAlertConsumed() {
        _newTicketAlert.value = false
    }
}
