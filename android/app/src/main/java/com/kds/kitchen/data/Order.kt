package com.kds.kitchen.data

import com.google.firebase.Timestamp

/**
 * Represents a single line item within an order.
 */
data class OrderItem(
    val item_id  : String = "",
    val name     : String = "",
    val quantity : Int    = 0,
    val notes    : String = "",
)

/**
 * Firestore document model for the `orders` collection.
 *
 * Firestore document path: orders/{orderId}
 */
data class Order(
    val id          : String      = "",
    val table_id    : String      = "",
    val status      : String      = "pending",   // pending | preparing | ready | completed
    val created_at  : Timestamp?  = null,
    val completed_at: Timestamp?  = null,
    val total_price : Double      = 0.0,
    val items       : List<OrderItem> = emptyList(),
)
