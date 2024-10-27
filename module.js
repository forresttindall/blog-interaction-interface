 
 
 // Import Firebase modules
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
 import { getDatabase, ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

 // Your Firebase configuration
 const firebaseConfig = {
   apiKey: "",
   authDomain: "",
   databaseURL: "",
   projectId: "",
   storageBucket: "",
   messagingSenderId: "",
   appId: ""
 };

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const db = getDatabase(app);

 // DOM Elements
 const likeButton = document.getElementById('likeButton');
 const commentButton = document.getElementById('commentButton');
 const shareButton = document.getElementById('shareButton');
 const commentSection = document.getElementById('commentSection');
 const commentInput = document.querySelector('.comment-input');
 const commentSubmit = document.querySelector('.comment-submit');
 const commentsContainer = document.querySelector('.comments-container');
 const shareDialog = document.getElementById('shareDialog');
 const overlay = document.getElementById('overlay');
 const toast = document.getElementById('toast');
 const likeCounter = document.getElementById('likeCounter');
 const commentCounter = document.getElementById('commentCounter');

 // Create references
 const articleId = 'article1'; // You can change this to identify different articles
 const likesRef = ref(db, `articles/${articleId}/likes`);
 const commentsRef = ref(db, `articles/${articleId}/comments`);

 // Initialize likes
 get(likesRef).then((snapshot) => {
   if (!snapshot.exists()) {
     set(likesRef, 0);
   }
 });

 // Listen for likes updates
 onValue(likesRef, (snapshot) => {
   const likes = snapshot.val() || 0;
   likeCounter.textContent = likes;
   
   // Update button state based on localStorage
   const userLiked = localStorage.getItem(`liked_${articleId}`) === 'true';
   if (userLiked) {
     likeButton.classList.add('active');
   } else {
     likeButton.classList.remove('active');
   }
 });

 // Listen for comments updates
 onValue(commentsRef, (snapshot) => {
   const comments = snapshot.val() || {};
   
   // Clear existing comments
   commentsContainer.innerHTML = '';
   
   // Add all comments
   Object.values(comments)
     .sort((a, b) => b.timestamp - a.timestamp)
     .forEach(comment => addCommentToUI(comment));
   
   // Update comment counter
   commentCounter.textContent = Object.keys(comments).length;
 });

 // Like functionality
 likeButton.addEventListener('click', async () => {
   const userLiked = localStorage.getItem(`liked_${articleId}`) === 'true';
   const newLikeState = !userLiked;
   
   // Get current likes
   const snapshot = await get(likesRef);
   const currentLikes = snapshot.val() || 0;
   
   // Update likes
   await set(likesRef, currentLikes + (newLikeState ? 1 : -1));
   
   // Update local storage
   localStorage.setItem(`liked_${articleId}`, newLikeState);
   
   // Update UI
   likeButton.classList.toggle('active');
   showToast(newLikeState ? 'Post liked!' : 'Post unliked');
 });

 // Comment functionality
 commentButton.addEventListener('click', () => {
   const isVisible = commentSection.style.display === 'block';
   commentSection.style.display = isVisible ? 'none' : 'block';
   commentButton.classList.toggle('active');
 });

 commentSubmit.addEventListener('click', async () => {
   const commentText = commentInput.value.trim();
   if (commentText) {
     // Create new comment
     const newComment = {
       text: commentText,
       author: 'Anonymous',
       timestamp: Date.now()
     };
     
     // Add comment to Firebase
     await push(commentsRef, newComment);
     
     // Clear input
     commentInput.value = '';
     showToast('Comment posted successfully!');
   }
 });

 // Function to add comment to UI
 function addCommentToUI(comment) {
   const commentElement = document.createElement('div');
   commentElement.className = 'comment';
   commentElement.innerHTML = `
     <div class="comment-meta">
       ${comment.author} • ${new Date(comment.timestamp).toLocaleString()}
     </div>
     <div class="comment-text">${comment.text}</div>
   `;
   commentsContainer.appendChild(commentElement);
 }

 // Share functionality
 shareButton.addEventListener('click', () => {
   shareDialog.style.display = 'block';
   overlay.style.display = 'block';
 });

 overlay.addEventListener('click', () => {
   shareDialog.style.display = 'none';
   overlay.style.display = 'none';
 });

 const shareOptions = document.querySelectorAll('.share-option');
 shareOptions.forEach(option => {
   option.addEventListener('click', () => {
     const platform = option.dataset.platform;
     handleShare(platform);
   });
 });

 function handleShare(platform) {
   const url = encodeURIComponent(window.location.href);
   const title = encodeURIComponent(document.title);
   let shareUrl;

   switch(platform) {
     case 'threads':
       shareUrl = `https://www.threads.net/share?text=${title} ${url}`;
       break;
     case 'facebook':
       shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
       break;
     case 'linkedin':
       shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
       break;
     case 'copy':
       navigator.clipboard.writeText(window.location.href);
       showToast('Link copied to clipboard!');
       closeShareDialog();
       return;
   }

   window.open(shareUrl, '_blank', 'width=600,height=400');
   closeShareDialog();
 }

 function closeShareDialog() {
   shareDialog.style.display = 'none';
   overlay.style.display = 'none';
 }

 // Toast functionality
 function showToast(message) {
   toast.textContent = message;
   toast.style.display = 'block';
   setTimeout(() => {
     toast.style.display = 'none';
   }, 3000);
 }