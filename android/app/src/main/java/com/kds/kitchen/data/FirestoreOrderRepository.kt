package com.kds.kitchen.data

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class FirestoreOrderRepository {
    private val firestore = FirebaseFirestore.getInstance().apply {
        // Enable offline persistence for reliability
        firestoreSettings = FirebaseFirestoreSettings.Builder()
            .setPersistenceEnabled(true)
            .build()
    }
    private val ordersCollection = firestore.collection("orders")

    fun observeActiveOrders(): Flow<List<Order>> = callbackFlow {
        val subscription = ordersCollection
            .whereIn("status", listOf("pending", "preparing"))
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val orders = snapshot.documents.mapNotNull { doc ->
                        val order = doc.toObject(Order::class.java)
                        order?.copy(id = doc.id)
                    }.sortedWith(compareBy({ it.status != "pending" }, { it.created_at?.seconds }))
                    trySend(orders)
                }
            }
        awaitClose { subscription.remove() }
    }

    fun updateStatus(orderId: String, newStatus: String) {
        val updates = mutableMapOf<String, Any>(
            "status" to newStatus
        )
        if (newStatus == "completed") {
            updates["completed_at"] = Timestamp.now()
        }
        ordersCollection.document(orderId).update(updates)
    }
}
