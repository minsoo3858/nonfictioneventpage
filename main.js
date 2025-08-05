import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdt4sjQe0ep9OCF4hnel11r3rV-jwVX6M",
  authDomain: "nonf-69ac6.firebaseapp.com",
  projectId: "nonf-69ac6",
  storageBucket: "nonf-69ac6.firebasestorage.app",
  messagingSenderId: "996272483315",
  appId: "1:996272483315:web:d40a522ad332ebb8c20086",
  measurementId: "G-P30474PJ1J",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
  // 모바일 디바이스 감지
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // 모바일에서 터치 스크롤 최적화
  if (isMobile) {
    document.body.style.webkitOverflowScrolling = "touch";
    document.body.style.overflowScrolling = "touch";
  }

  // 로고 클릭 시 새로고침
  const mainLogo = document.getElementById("main-logo");
  if (mainLogo) {
    mainLogo.addEventListener("click", () => {
      window.location.reload();
    });
  }

  // 로그인 텍스트 영역
  const loginText = document.getElementById("login-text");
  let currentUser = null;

  function updateLoginUI(user) {
    if (user) {
      loginText.textContent = user.displayName
        ? `${user.displayName} (Logout)`
        : "Logout";
      loginText.onclick = async () => {
        try {
          await signOut(auth);
        } catch (e) {
          alert("로그아웃 실패: " + e.message);
        }
      };
    } else {
      loginText.textContent = "Login";
      loginText.onclick = async () => {
        try {
          await signInWithPopup(auth, provider);
        } catch (e) {
          alert("로그인 실패: " + e.message);
        }
      };
    }
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateLoginUI(user);
  });

  // Loading Screen Elements
  const loadingScreen = document.getElementById("loading-screen");
  const glitchEffect = document.querySelector(".glitch-effect");

  // Main Content Elements
  // 이하 기능은 로그인 테스트 후 주석 처리
  const startBtn = document.getElementById("start-ai-btn");
  const aiRecommender = document.getElementById("ai-recommender");
  const options = document.querySelectorAll(".option");
  const resultContainer = document.getElementById("result-container");
  const resultScent = document.getElementById("result-scent");
  const resultDescription = document.getElementById("result-description");
  const dynamicBg = document.getElementById("dynamic-bg");
  const productItems = document.querySelectorAll(".product-item");

  // --- Loading Screen Logic ---
  setTimeout(() => {
    glitchEffect.classList.add("active");
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 800);
  }, 1500);

  // --- Dynamic Background Effect ---
  // 데스크톱에서는 마우스 이벤트, 모바일에서는 터치 이벤트 사용
  function updateBackground(x, y) {
    const xPercent = (x / window.innerWidth) * 100;
    const yPercent = (y / window.innerHeight) * 100;
    dynamicBg.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, rgba(255, 255, 255, 0.05), rgba(0,0,0,0) 50%)`;
  }

  // 마우스 이벤트 (데스크톱)
  document.addEventListener("mousemove", (e) => {
    updateBackground(e.clientX, e.clientY);
  });

  // 터치 이벤트 (모바일)
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateBackground(touch.clientX, touch.clientY);
      }
    },
    { passive: true }
  );

  // 터치 시작 이벤트
  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateBackground(touch.clientX, touch.clientY);
      }
    },
    { passive: true }
  );

  // --- Scroll Animations ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );

  if (aiRecommender) observer.observe(aiRecommender);
  productItems.forEach((item) => observer.observe(item));

  // --- AI Recommender Logic ---
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      if (!auth.currentUser) {
        try {
          await signInWithPopup(auth, provider);
        } catch (e) {
          alert("로그인 실패: " + e.message);
          return;
        }
      }
    });
  }
});

// --- AI Recommender Logic ---
if (startBtn) {
  startBtn.addEventListener("click", async () => {
    if (!auth.currentUser) {
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        alert("로그인 실패: " + e.message);
        return;
      }
    }
    const heroSection = document.querySelector(".hero");
    const originalHeading = heroSection.querySelector("h2");
    const originalParagraph = heroSection.querySelector("p");
    originalHeading.style.opacity = "0";
    originalParagraph.style.opacity = "0";
    originalHeading.style.transition = "opacity 0.5s ease-out";
    originalParagraph.style.transition = "opacity 0.5s ease-out";
    setTimeout(() => {
      startBtn.style.display = "none";
      const quizContainer = document.createElement("div");
      quizContainer.id = "quiz-container";
      quizContainer.style.opacity = "0";
      quizContainer.style.transition = "opacity 0.5s ease-out";
      quizContainer.innerHTML = `
          <p class="question">당신은 어떤 단어에 끌리시나요?</p>
          <div class="options">
            <button class="option" data-value="calm"><img src="/public/고요함.jpg" alt="고요함" class="option-image">고요함</button>
            <button class="option" data-value="subtle"><img src="/public/섬세함.jpg" alt="섬세함" class="option-image">섬세함</button>
            <button class="option" data-value="free"><img src="/public/자유로움.jpg" alt="자유로움" class="option-image">자유로움</button>
          </div>
        `;
      startBtn.parentNode.insertBefore(quizContainer, startBtn.nextSibling);
      setTimeout(() => {
        quizContainer.style.opacity = "1";
      }, 50);
      const newOptions = quizContainer.querySelectorAll(".option");
      newOptions.forEach((option) => {
        option.addEventListener("click", () => {
          quizContainer.innerHTML = `
              <p class="question">당신은 언제 가장 나다워지나요?</p>
              <div class="options">
                <button class="option" data-value="alone"><img src="/public/혼자 조용한 시간 속에서.jpg" alt="혼자 조용한 시간 속에서" class="option-image">혼자 조용한 시간 속에서</button>
                <button class="option" data-value="with-people"><img src="/public/좋아하는 사람들과 감정을 나눌 때.jpg" alt="좋아하는 사람들과 감정을 나눌 때" class="option-image">좋아하는 사람들과 감정을 나눌 때</button>
                <button class="option" data-value="new-experience"><img src="/public/낯선 곳에서 새로운 경험을 할 때.jpg" alt="낯선 곳에서 새로운 경험을 할 때" class="option-image">낯선 곳에서 새로운 경험을 할 때</button>
              </div>
            `;
          const secondOptions = quizContainer.querySelectorAll(".option");
          secondOptions.forEach((secondOption) => {
            secondOption.addEventListener("click", () => {
              if (secondOption.dataset.value === "alone") {
                quizContainer.innerHTML = `
                    <div class="perfume-result">
                      <img src="/public/gentlenight.jpg" alt="Gentle Night" class="result-image fade-in" id="perfume-img" style="max-width:320px;display:block;margin:0 auto 2rem auto;">
                      <h3 class="fade-in" id="perfume-title" style="text-align:center;">Gentle Night</h3>
                      <p id="perfume-description" style="text-align:center;color:#a0a0a0;min-height:3em;"></p>
                    </div>
                  `;
                setTimeout(() => {
                  document
                    .getElementById("perfume-img")
                    .classList.add("visible");
                  document
                    .getElementById("perfume-title")
                    .classList.add("visible");
                }, 100);
                const desc =
                  "깊은 우디와 머스크, 이끼의 톤과 무화과 향이 고요함을 나타냅니다. 혼자만의 내면에 머무는 시간에 어울리는 향수로, 당신의 본질적인 고요함을 '향수로 기록' 합니다.";
                const descElem = document.getElementById("perfume-description");
                let i = 0;
                function typeWriter() {
                  if (i <= desc.length) {
                    descElem.textContent = desc.slice(0, i);
                    i++;
                    setTimeout(typeWriter, 32);
                  }
                }
                setTimeout(typeWriter, 700);
              } else {
                resultScent.textContent = "";
                resultDescription.textContent =
                  "감사합니다! (여기에 결과 또는 다음 로직을 구현하세요)";
                resultContainer.classList.add("visible");
                resultContainer.classList.remove("hidden");
                setTimeout(() => {
                  resultContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 200);
              }
            });
          });
        });
      });
    }, 500);
  });
}

// 첫번째 퀴즈(기본) 옵션 클릭 시 결과 표시
const scentData = {
  calm: {
    name: "SANTAL CREAM",
    description:
      "고요하고 편안한 순간을 위한 부드러운 우디향. 차분한 당신에게 깊은 안정감을 선사합니다.",
  },
  fresh: {
    name: "FOR REST",
    description:
      "숲 속의 상쾌함을 담은 시트러스 그린 노트. 리프레시가 필요한 당신에게 활력을 더해줍니다.",
  },
  energetic: {
    name: "GENTLE NIGHT",
    description:
      "따뜻하고 스파이시한 오리엔탈 향. 활기찬 당신의 하루를 더욱 특별하게 만들어줍니다.",
  },
  romantic: {
    name: "GAIAC FLOWER",
    description:
      "매혹적인 스모키 플로럴 향. 로맨틱한 분위기를 연출하고 싶을 때 완벽한 선택입니다.",
  },
};

options.forEach((option) => {
  function handleOptionSelect() {
    const selectedValue = option.dataset.value;
    const result = scentData[selectedValue];
    if (result) {
      resultScent.textContent = result.name;
      resultDescription.textContent = result.description;
      resultContainer.classList.add("visible");
      resultContainer.classList.remove("hidden");
      setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }

  // 클릭 이벤트
  option.addEventListener("click", handleOptionSelect);

  // 터치 이벤트 (모바일 최적화)
  option.addEventListener("touchend", (e) => {
    e.preventDefault(); // 더블 탭 줌 방지
    handleOptionSelect();
  });
});

// 제품 hover 효과
productItems.forEach((item) => {
  const productName = item.querySelector("p").textContent;
  const infoDiv = document.createElement("div");
  infoDiv.classList.add("product-info");
  infoDiv.innerHTML = `<p>${productName}</p>`;
  item.appendChild(infoDiv);
  item.querySelector("p").style.display = "none";
});
