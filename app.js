let peer;
let localStream;
let currentCall;
let currentUser;
const users = {};

const loginContainer = document.getElementById("login-container");
const signupContainer = document.getElementById("signup-container");
const chatContainer = document.getElementById("chat-container");
const userList = document.getElementById("user-list");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const callButton = document.getElementById("call-button");
const endCallButton = document.getElementById("end-call-button");

document.getElementById("show-signup").addEventListener("click", (e) => {
  e.preventDefault();
  loginContainer.style.display = "none";
  signupContainer.style.display = "block";
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  signupContainer.style.display = "none";
  loginContainer.style.display = "block";
});

document.getElementById("signup-button").addEventListener("click", () => {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  if (username && password) {
    users[username] = { password, peerId: null };
    alert("Signup successful. Please login.");
    signupContainer.style.display = "none";
    loginContainer.style.display = "block";
  }
});

document.getElementById("login-button").addEventListener("click", () => {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  if (users[username] && users[username].password === password) {
    currentUser = username;
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
    initPeer(username);
  } else {
    alert("Invalid username or password");
  }
});

function initPeer(username) {
  peer = new Peer();

  peer.on("open", (id) => {
    console.log("My peer ID is: " + id);
    users[username].peerId = id;
    updateUserList();
  });

  peer.on("call", (call) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          remoteVideo.srcObject = remoteStream;
        });
        currentCall = call;
        callButton.disabled = true;
        endCallButton.disabled = false;
      })
      .catch((error) => console.error("Error accessing media devices:", error));
  });
}

function updateUserList() {
  userList.innerHTML = "";
  for (const [username, user] of Object.entries(users)) {
    if (user.peerId && user.peerId !== peer.id) {
      const userElement = document.createElement("div");
      userElement.textContent = username;
      userElement.classList.add("user-item");
      userElement.addEventListener("click", () => selectUser(username));
      userList.appendChild(userElement);
    }
  }
}

function selectUser(username) {
  const userElements = userList.querySelectorAll(".user-item");
  userElements.forEach((el) => el.classList.remove("selected"));
  const selectedElement = Array.from(userElements).find(
    (el) => el.textContent === username,
  );
  if (selectedElement) {
    selectedElement.classList.add("selected");
    callButton.disabled = false;
  }
}

function startCall(remotePeerId) {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      const call = peer.call(remotePeerId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
      });
      currentCall = call;
      callButton.disabled = true;
      endCallButton.disabled = false;
    })
    .catch((error) => console.error("Error accessing media devices:", error));
}

callButton.addEventListener("click", () => {
  const selectedUser = userList.querySelector(".selected");
  if (selectedUser) {
    const remotePeerId = users[selectedUser.textContent].peerId;
    startCall(remotePeerId);
  } else {
    alert("Please select a user to call");
  }
});

endCallButton.addEventListener("click", () => {
  if (currentCall) {
    currentCall.close();
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  callButton.disabled = false;
  endCallButton.disabled = true;
});

// Initialize call button as disabled
callButton.disabled = true;
endCallButton.disabled = true;
