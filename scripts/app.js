// DOM elements
const sendCoinsButton = document.getElementById('send-coins');
const viewHistoryButton = document.getElementById('view-history');
const userBalanceSpan = document.getElementById('user-balance');

// Current user data
let currentUser = null;
let userBalance = 0;
let friends = [];

// Load user data from Firestore
async function loadUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      currentUser = {
        id: userId,
        ...userDoc.data()
      };
      
      userBalance = currentUser.balance || 0;
      userBalanceSpan.textContent = userBalance;
      
      // Load friend list (all users except current user)
      const usersSnapshot = await db.collection('users').get();
      friends = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== userId);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

// Send coins modal
sendCoinsButton.addEventListener('click', () => {
  if (!currentUser) return;
  
  // Create modal HTML with friend options
  const friendOptions = friends.map(friend => 
    `<option value="${friend.id}">${friend.displayName || friend.email}</option>`
  ).join('');
  
  const modalHTML = `
    <div id="send-coins-modal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Send FriendCoins</h2>
        <form id="send-coins-form">
          <select id="friend-select" required>
            <option value="" disabled selected>Select a friend</option>
            ${friendOptions}
          </select>
          <input type="number" id="coin-amount" placeholder="Amount" min="1" max="${userBalance}" required>
          <input type="text" id="coin-reason" placeholder="Reason for sending" required>
          <button type="submit">Send Coins</button>
        </form>
      </div>
    </div>
  `;
  
  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('send-coins-modal');
  const closeButton = modal.querySelector('.close');
  const form = document.getElementById('send-coins-form');
  
  // Show modal
  modal.style.display = 'block';
  
  // Close modal when clicking the X
  closeButton.addEventListener('click', () => {
    modal.remove();
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const friendId = document.getElementById('friend-select').value;
    const amount = parseInt(document.getElementById('coin-amount').value);
    const reason = document.getElementById('coin-reason').value;
    
    if (amount <= 0 || amount > userBalance) {
      alert('Invalid amount');
      return;
    }
    
    try {
      // Create the transaction in Firestore using a batch
      const batch = db.batch();
      
      // 1. Create transaction record
      const transactionRef = db.collection('transactions').doc();
      batch.set(transactionRef, {
        sender: currentUser.id,
        senderName: currentUser.displayName || currentUser.email,
        recipient: friendId,
        recipientName: friends.find(f => f.id === friendId).displayName || friends.find(f => f.id === friendId).email,
        amount: amount,
        reason: reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // 2. Update sender's balance
      const senderRef = db.collection('users').doc(currentUser.id);
      batch.update(senderRef, {
        balance: firebase.firestore.FieldValue.increment(-amount)
      });
      
      // 3. Update recipient's balance
      const recipientRef = db.collection('users').doc(friendId);
      batch.update(recipientRef, {
        balance: firebase.firestore.FieldValue.increment(amount)
      });
      
      // Commit the batch
      await batch.commit();
      
      // Update local balance
      userBalance -= amount;
      userBalanceSpan.textContent = userBalance;
      
      // Close modal on success
      modal.remove();
      alert('FriendCoins sent successfully!');
    } catch (error) {
      console.error("Error sending coins:", error);
      alert(`Error: ${error.message}`);
    }
  });
});

// View transaction history
viewHistoryButton.addEventListener('click', async () => {
  if (!currentUser) return;
  
  try {
    // Get transactions where user is sender or recipient
    const sentSnapshot = await db.collection('transactions')
      .where('sender', '==', currentUser.id)
      .orderBy('timestamp', 'desc')
      .get();
    
    const receivedSnapshot = await db.collection('transactions')
      .where('recipient', '==', currentUser.id)
      .orderBy('timestamp', 'desc')
      .get();
    
    // Combine and sort transactions
    const sentTransactions = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'sent' }));
    const receivedTransactions = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'received' }));
    
    const allTransactions = [...sentTransactions, ...receivedTransactions].sort((a, b) => {
      return (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0);
    });
    
    // Create modal HTML with transactions
    const transactionsHTML = allTransactions.map(transaction => {
      const date = transaction.timestamp ? transaction.timestamp.toDate().toLocaleString() : 'Pending';
      const isSent = transaction.type === 'sent';
      const otherPerson = isSent ? transaction.recipientName : transaction.senderName;
      
      return `
        <div class="transaction-item">
          <div>
            <strong>${isSent ? 'Sent to' : 'Received from'} ${otherPerson}</strong>
            <p>${transaction.reason}</p>
            <small>${date}</small>
          </div>
          <div style="color: ${isSent ? 'red' : 'green'};">
            ${isSent ? '-' : '+'} ${transaction.amount} coins
          </div>
        </div>
      `;
    }).join('') || '<p>No transactions found</p>';
    
    const modalHTML = `
      <div id="history-modal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Transaction History</h2>
          <div class="history-container">
            ${transactionsHTML}
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('history-modal');
    const closeButton = modal.querySelector('.close');
    
    // Show modal
    modal.style.display = 'block';
    
    // Close modal when clicking the X
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error("Error loading history:", error);
    alert(`Error: ${error.message}`);
  }
});
