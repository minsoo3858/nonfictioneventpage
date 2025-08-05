// Firebase 인증 기능 제거됨

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

  // 로그인 기능 제거됨

  // Loading Screen Elements
  const loadingScreen = document.getElementById("loading-screen");
  const glitchEffect = document.querySelector(".glitch-effect");

  // Main Content Elements
  // 이하 기능은 로그인 테스트 후 주석 처리
  const startBtn = document.getElementById("start-ai-btn");
  const realTimeWordsBtn = document.getElementById("real-time-words-btn");
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
      // 로그인 성공 후 sidea 페이지로 이동
      window.location.href = "./sidea/index.html";
    });
  }

  // --- Real Time Words Button Logic ---
  if (realTimeWordsBtn) {
    realTimeWordsBtn.addEventListener("click", async () => {
      if (!auth.currentUser) {
        try {
          await signInWithPopup(auth, provider);
        } catch (e) {
          alert("로그인 실패: " + e.message);
          return;
        }
      }
      // 로그인 성공 후 sideb 페이지로 이동
      window.location.href = "./sideb/index.html";
    });
  }
});

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
