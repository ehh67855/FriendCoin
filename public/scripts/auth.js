// DOM elements
const signInButton = document.getElementById('sign-in');
const signUpButton = document.getElementById('sign-up');
const signOutButton = document.getElementById('sign-out');
const whenSignedOut = document.getElementById('when-signed-out');
const whenSignedIn = document.getElementById('when-signed-in');
const userNameSpan = document.getElementById('user-name');

// Authentication state observer
auth.onAuthStateChanged(user => {
  if (user) {
    // User is signed in
    whenSignedIn.classList.remove('hidden');
    whenSignedOut.classList.add('hidden');
    userNameSpan.textContent = user.displayName || user.email;
    
    // Load user data
    loadUserData(user.uid);
  } else {
    // User is signed out
    whenSignedIn.classList.add('hidden');
    whenSignedOut.classList.remove('hidden');
  }
});

// Sign in with email/password modal
signInButton.addEventListener('click', () => {
  showAuthModal('signin');
});

// Sign up with email/password modal
signUpButton.addEventListener('click', () => {
  showAuthModal('signup');
});

// Sign out
signOutButton.addEventListener('click', () => {
  auth.signOut();
});

// Show authentication modal
function showAuthModal(type) {
  // Create modal HTML
  const modalHTML = `
    <div id="auth-modal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${type === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
        <form id="auth-form">
          <input type="email" id="email" placeholder="Email" required>
          <input type="password" id="password" placeholder="Password" required>
          ${type === 'signup' ? '<input type="text" id="display-name" placeholder="Display Name">' : ''}
          <button type="submit">${type === 'signin' ? 'Sign In' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  `;
  
  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('auth-modal');
  const closeButton = modal.querySelector('.close');
  const form = document.getElementById('auth-form');
  
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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      if (type === 'signin') {
        // Sign in
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        // Sign up
        const displayName = document.getElementById('display-name').value;
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Set display name
        if (displayName) {
          await userCredential.user.updateProfile({
            displayName: displayName
          });
        }
        
        // Initialize user in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          displayName: displayName || email,
          balance: 10, // Starting balance
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Close modal on success
      modal.remove();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
}
