let data = [];
let currentQuestion = 0;
let score = 0;
let selectedMode = "";
let questions = [];
let totalTime = 0;
let timer;
let userAnswers = [];
let quizOptions = [];
let isTestSubmitted = false;

// document.getElementById('mode').addEventListener('change', (e) => {
//   selectedMode = e.target.value;
// });
document.getElementById('mode').addEventListener('change', (e) => {
  selectedMode = e.target.value;

  // Hiển thị trường nhập tên nếu chọn chế độ kiểm tra
  const nameInputContainer = document.getElementById("nameInputContainer");
  if (selectedMode === "test-quiz") {
    nameInputContainer.style.display = "block";
  } else {
    nameInputContainer.style.display = "none";
  }
});

// function validateAndStart() {
//   const mode = document.getElementById("mode").value;
//   const count = document.getElementById("questionCount").value;

//   if (!mode || !count) {
//     alert("Vui lòng chọn đầy đủ chế độ và số câu!");
//     return;
//   }

//   startTest();
// }
function validateAndStart() {
  const mode = document.getElementById("mode").value;
  const count = document.getElementById("questionCount").value;

  if (!mode || !count) {
    alert("Vui lòng chọn đầy đủ chế độ và số câu!");
    return;
  }

  if (mode === "test-quiz") {
    const userName = document.getElementById("userName").value.trim();
    if (!userName) {
      alert("Vui lòng nhập tên của bạn!");
      return;
    }
  }

  startTest();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTest() {
  const count = parseInt(document.getElementById("questionCount").value);
  currentQuestion = 0;
  score = 0;
  userAnswers = [];
  totalTime = count * 60;
  isTestSubmitted = false;
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("submitBtn").classList.add("hidden");
  document.getElementById("result").textContent = "";
  document.getElementById("settingsPanel").classList.add("hidden");
  document.getElementById("refreshContainer").classList.add("hidden");

  questions = shuffle(data.filter(d => !d.Checked)).slice(0, count);

  if (selectedMode.includes("quiz")) {
    quizOptions = questions.map(q => {
      return shuffle([q.Nghia, ...shuffle(data.filter(d => d.Tu !== q.Tu)).slice(0, 3).map(d => d.Nghia)]);
    });
  }

  generatePaging();

  if (selectedMode.startsWith("test")) {
    document.getElementById("timer").classList.remove("hidden");
    updateTimer();
    timer = setInterval(() => {
      totalTime--;
      updateTimer();
      if (totalTime <= 0) endTest(true);
    }, 1000);
    document.getElementById("submitBtn").classList.remove("hidden");
  } else {
    document.getElementById("refreshContainer").classList.remove("hidden");
  }

  showQuestion();
}

function updateTimer() {
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  document.getElementById("timer").textContent = `⏳ ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function generatePaging() {
  const paging = document.getElementById("paging");
  paging.innerHTML = "";
  questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    btn.className = "px-3 py-1 rounded border";
    btn.onclick = () => {
      currentQuestion = index;
      showQuestion();
    };
    btn.id = `page-${index}`;
    paging.appendChild(btn);
  });
}

function updatePagingStatus(index, status) {
  const btn = document.getElementById(`page-${index}`);
  if (!btn) return;
  btn.classList.remove("bg-blue-500", "bg-yellow-300", "bg-green-400", "bg-red-400", "text-white");
  if (status === "answered") {
    btn.classList.add("bg-yellow-300");
  } else if (status === "correct") {
    btn.classList.add("bg-green-400", "text-white");
  } else if (status === "incorrect") {
    btn.classList.add("bg-red-400", "text-white");
  }
}

function showQuestion() {
  if (currentQuestion >= questions.length) return;

  if (selectedMode.includes("write")) {
    showWriteQuestion();
    return;
  }

  // Phần trắc nghiệm
  const q = questions[currentQuestion];
  const options = quizOptions[currentQuestion];
  let html = "";
  const ua = userAnswers[currentQuestion];

  // html += `<div class='text-xl mb-4 font-bold'>Từ: <span class='text-blue-600'>${q.Tu}</span></div>`;
  html += `<div class='text-xl mb-4 font-bold'>
  Từ: <span class='text-blue-600'>${q.Tu}</span>
  <button onclick="speak('${q.Tu.split(' ')[0]}')" title="Phát âm" class="ml-2 text-blue-500 hover:text-blue-700">🔊</button>
</div>`;


  options.forEach((opt, i) => {
    let selectedClass = "";
    let disabledAttr = "";

    // Loại bỏ dấu ngoặc kép trong đáp án
    const sanitizedOpt = opt.replace(/"/g, "");

    // Chế độ học: disable sau khi chọn
    if (selectedMode === "learn-quiz" && ua) {
      disabledAttr = "disabled";
      if (ua.userAnswer === sanitizedOpt && ua.userAnswer === q.Nghia) {
        selectedClass = "bg-green-400 text-white";
      } else if (ua.userAnswer === sanitizedOpt) {
        selectedClass = "bg-red-400 text-white";
      } else if (sanitizedOpt === q.Nghia) {
        selectedClass = "bg-green-400 text-white";
      }
    }
    // Chế độ kiểm tra: disable sau khi nộp bài
    else if (selectedMode === "test-quiz" && isTestSubmitted) {
      disabledAttr = "disabled";
      if (ua?.userAnswer === sanitizedOpt && ua.userAnswer === q.Nghia) {
        selectedClass = "bg-green-400 text-white";
      } else if (ua?.userAnswer === sanitizedOpt) {
        selectedClass = "bg-red-400 text-white";
      } else if (sanitizedOpt === q.Nghia) {
        selectedClass = "bg-green-400 text-white";
      }
    }
    // Chế độ kiểm tra chưa nộp: highlight đã chọn
    else if (selectedMode === "test-quiz" && ua?.userAnswer === sanitizedOpt) {
      selectedClass = "bg-yellow-300";
    }

    // Sử dụng encodeURIComponent để mã hóa đáp án
    const encodedOpt = encodeURIComponent(sanitizedOpt);

    html += `<button ${disabledAttr} onclick="checkAnswer('${encodedOpt}')" 
          class='block w-full text-left mb-2 px-4 py-2 border rounded hover:bg-blue-100 ${selectedClass}'>
          ${String.fromCharCode(65 + i)}. ${sanitizedOpt}</button>`;
  });

  // Hiển thị kết quả chi tiết
  if (ua && (selectedMode === "learn-quiz" || (selectedMode === "test-quiz" && isTestSubmitted))) {
    if (ua.userAnswer === q.Nghia) {
      html += `<div class="mt-2 text-green-600 font-semibold">✅ Bạn chọn: ${ua.userAnswer} (chính xác)</div>`;
    } else {
      html += `<div class="mt-2 text-red-600 font-semibold">❌ Bạn chọn: ${ua.userAnswer}<br/>Đáp án đúng: ${q.Nghia}</div>`;
    }
  }

  document.getElementById("questionContainer").innerHTML = html;
}

function showWriteQuestion() {
  const q = questions[currentQuestion];
  const ua = userAnswers[currentQuestion];
  let html = "";

  // html += `<div class='text-xl mb-4 font-bold'>Nghĩa: <span class='text-green-600'>${q.Nghia}</span></div>`;
  html += `<div class='text-xl mb-4 font-bold'>
  Nghĩa: <span class='text-green-600'>${q.Nghia}</span>`;
  if (ua) {
    html += `<button onclick="speak('${q.Tu.split(' ')[0]}')" title="Phát âm" class="ml-2 text-blue-500 hover:text-blue-700">🔊</button>`;
  }
  html += `</div>`;

  const isTestMode = selectedMode === "test-write";
  const isSubmitted = isTestMode && isTestSubmitted;
  const isLearnAnswered = selectedMode === "learn-write" && ua;

  // Hiển thị kết quả nếu đã nộp bài (test) hoặc đã kiểm tra (learn)
  if (isSubmitted || isLearnAnswered) {
    const correctAnswer = q.Tu.split(" ")[0].toLowerCase();
    const userAnswer = ua?.userAnswer?.toLowerCase() || "";
    const isCorrect = userAnswer === correctAnswer;

    html += `<div class='mb-4 p-2 border rounded ${isCorrect ? 'bg-green-100' : 'bg-red-100'}'>`;
    html += `<div class='font-semibold'>Đáp án của bạn: ${userAnswer || "(Chưa trả lời)"}</div>`;
    html += `<div class='font-semibold'>Đáp án đúng: ${correctAnswer}</div>`;
    html += `</div>`;

    if (!isCorrect) {
      html += `<div class='text-sm text-gray-600'>Từ đầy đủ: ${q.Tu}</div>`;
    }
  }
  // Hiển thị ô nhập đáp án nếu chưa nộp/kiểm tra
  else {
    const disabled = (isTestMode && isTestSubmitted) ? "disabled" : "";
    html += `<input id='writtenAnswer' type='text' placeholder='Nhập từ tiếng Anh' 
            class='w-full p-2 border rounded mb-2' ${disabled} 
            value="${ua?.userAnswer || ''}" />`;

    // Chỉ hiện nút Kiểm tra ở chế độ học
    if (selectedMode === "learn-write") {
      html += `<button onclick='checkLearnWriteAnswer()' 
              class='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>
              Kiểm tra</button>`;
    }
  }

  document.getElementById("questionContainer").innerHTML = html;
}

function checkLearnWriteAnswer() {
  const answer = document.getElementById("writtenAnswer").value.trim();
  const q = questions[currentQuestion];
  userAnswers[currentQuestion] = { ...q, userAnswer: answer };

  updatePagingStatus(currentQuestion, answer ? "answered" : "unanswered");
  showWriteQuestion(); // Hiển thị kết quả
}

function checkAnswer(selected) {
  const decodedAnswer = decodeURIComponent(selected).replace(/"/g, ""); // Loại bỏ dấu ngoặc kép
  const q = questions[currentQuestion];
  const isCorrect = decodedAnswer === q.Nghia;
  userAnswers[currentQuestion] = { ...q, userAnswer: decodedAnswer };

  updatePagingStatus(currentQuestion, "answered");

  if (selectedMode === "learn-quiz") {
    showQuestion(); // Hiển thị kết quả ngay
  } else {
    nextQuestion(); // Chế độ kiểm tra chuyển câu tiếp theo
  }
}

// function nextQuestion() {
//   currentQuestion++;
//   if (currentQuestion < questions.length) showQuestion();
//   else if (!selectedMode.startsWith("test")) endTest(false);
// }
function nextQuestion() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    // Nếu là câu cuối cùng, hiển thị lại câu hiện tại để cập nhật màu vàng
    showQuestion();
  }
}
function endTest(showReview) {
  clearInterval(timer);
  document.getElementById("submitBtn").classList.add("hidden");
  document.getElementById("timer").classList.add("hidden");
  isTestSubmitted = true;
  document.getElementById("refreshContainer").classList.remove("hidden");

  if (selectedMode.startsWith("test")) {
    let correctCount = 0;
    userAnswers.forEach((ans, idx) => {
      if (!ans) return;

      // Xử lý khác nhau giữa trắc nghiệm và viết từ
      let isCorrect = false;
      if (selectedMode.includes("quiz")) {
        isCorrect = ans.userAnswer === ans.Nghia;
      } else {
        const correct = ans.Tu.split(" ")[0].toLowerCase();
        isCorrect = ans.userAnswer?.toLowerCase() === correct;
      }

      if (isCorrect) {
        correctCount++;
        updatePagingStatus(idx, "correct");
      } else {
        updatePagingStatus(idx, "incorrect");
      }
    });

    const totalQuestions = questions.length;
    document.getElementById("result").textContent = `🎉 Bạn đã hoàn thành! Số câu đúng: ${correctCount}/${questions.length}`;
    // Lưu lịch sử thi
    saveHistory(correctCount, totalQuestions);
  }

  showQuestion();
}

fetch("https://docs.google.com/spreadsheets/d/120CoX9VP_g8s4R6lTPa5T2ykXKJykL6qKel_L94zR5c/export?format=csv")
  .then(response => response.text())
  .then(csv => {
    const rows = csv.split("\n").map(row => row.split(","));
    data = rows.map(([Tu, Nghia]) => ({
      Tu: Tu.replace(/"/g, ""), // Loại bỏ dấu ngoặc kép
      Nghia: Nghia.replace(/"/g, ""), // Loại bỏ dấu ngoặc kép
      Checked: false
    }));

    console.log("Dữ liệu đã được cập nhật vào data:", data);
  })
  .catch(error => console.error("Lỗi khi tải dữ liệu:", error));

function speak(text, voiceName = "Google US English") {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(voice => voice.name === voiceName);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

function saveHistory(correctCount, totalQuestions) {
  const now = new Date();
  const date = now.toLocaleDateString("vi-VN");
  const time = now.toLocaleTimeString("vi-VN");
  const userName = document.getElementById("userName")?.value.trim() || "Không rõ";

  const data = {
    date: date,
    time: time,
    score: `${correctCount}/${totalQuestions}`,
    name: userName,
  };

  // URL của Web App Google Apps Script
  const webhookUrl = "https://script.google.com/macros/s/AKfycbz2hLhKldXC9owrL_GrVV5U3pUk0BILtg7BsgSF1ffxjmh-pOHUj_ZMdb0qTjWViBRu/exec"; // Thay bằng URL Web App của bạn

  // Gửi dữ liệu đến Google Sheets
  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Lịch sử thi đã được lưu thành công!");
      } else {
        console.error("Lỗi khi lưu lịch sử thi:", response.statusText);
      }
    })
    .catch((error) => console.error("Lỗi khi kết nối webhook:", error));
}