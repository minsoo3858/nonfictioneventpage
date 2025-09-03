// Firebase 인증 기능 제거됨
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  // 로그인/로그아웃 버튼 동적 생성 함수
  function renderAuthButtons(session) {
    let header = document.querySelector("header");
    if (!header) return;
    let authBtn = document.getElementById("auth-btn");
    if (authBtn) authBtn.remove();
    authBtn = document.createElement("button");
    authBtn.id = "auth-btn";
    authBtn.style.marginLeft = "16px";
    authBtn.style.padding = "0.5em 1.2em";
    authBtn.style.borderRadius = "1.2em";
    authBtn.style.border = "none";
    authBtn.style.fontWeight = "bold";
    authBtn.style.cursor = "pointer";
    authBtn.style.background = "#e4c662";
    authBtn.style.color = "#222";
    if (session && session.user) {
      authBtn.textContent = "로그아웃";
      authBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.reload();
      };
    } else {
      authBtn.textContent = "로그인";
      authBtn.onclick = async () => {
        // 자동 로그인 방지: 기존 세션 강제 로그아웃 후 로그인 시도
        await supabase.auth.signOut();
        localStorage.setItem("afterLoginRedirect", "sidea");
        await signInWithProvider("kakao", "manual_login_btn");
      };
    }
    // 헤더 오른쪽에 버튼 추가
    header.appendChild(authBtn);
  }
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
  if (loadingScreen) {
    setTimeout(() => {
      if (glitchEffect) {
        glitchEffect.classList.add("active");
      }
      setTimeout(() => {
        loadingScreen.style.transition = "opacity 0.5s ease-out";
        loadingScreen.style.opacity = "0";
        loadingScreen.classList.add("hidden");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 500);
      }, 800);
    }, 1500);
  }

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
  if (productItems && productItems.length > 0) {
    productItems.forEach((item) => observer.observe(item));
  }

  // --- AI Recommender Logic ---

  // --- AI Recommender Logic ---
  if (startBtn) {
    startBtn.style.display = "inline-block";
    startBtn.disabled = false;
    startBtn.addEventListener("click", async () => {
      // 자동 로그인 방지: 기존 세션 강제 로그아웃 후 로그인 시도
      await supabase.auth.signOut();
      localStorage.setItem("afterLoginRedirect", "sidea");
      await signInWithProvider("kakao", "start_button_click");
    });
  } else {
    console.warn(
      "start-ai-btn 버튼이 없습니다. HTML에 id='start-ai-btn' 버튼이 있는지 확인하세요."
    );
  }

  // --- Real Time Words Button Logic ---
  if (realTimeWordsBtn) {
    realTimeWordsBtn.style.display = "inline-block";
    realTimeWordsBtn.disabled = false;
    realTimeWordsBtn.addEventListener("click", async () => {
      // 자동 로그인 방지: 기존 세션 강제 로그아웃 후 로그인 시도
      await supabase.auth.signOut();
      localStorage.setItem("afterLoginRedirect", "sideb");
      await signInWithProvider("kakao", "realtime_words_click");
    });
  } else {
    console.warn(
      "real-time-words-btn 버튼이 없습니다. HTML에 id='real-time-words-btn' 버튼이 있는지 확인하세요."
    );
  }

  // 인증 상태 변화 감지하여 로그인 후 자동 이동 및 버튼 표시
  supabase.auth.onAuthStateChange((event, session) => {
    renderAuthButtons(session);
    if (event === "SIGNED_IN" && session && session.user) {
      // 카카오톡 로그인 성공 시 Supabase에 기록
      logEvent("kakao_login_success", session.user.id);
      const redirect = localStorage.getItem("afterLoginRedirect");
      if (redirect === "sidea") {
        localStorage.removeItem("afterLoginRedirect");
        window.location.href = "/sidea/index.html";
      } else if (redirect === "sideb") {
        localStorage.removeItem("afterLoginRedirect");
        window.location.href = "/sideb/index.html";
      }
    }
  });

  // 페이지 로드시 현재 세션으로 버튼 표시
  supabase.auth.getSession().then(({ data }) => {
    renderAuthButtons(data?.session);
  });

  // 제품 hover 효과 (요소가 존재할 때만)
  if (productItems && productItems.length > 0) {
    productItems.forEach((item) => {
      const productNameElement = item.querySelector("p");
      if (productNameElement) {
        const productName = productNameElement.textContent;
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("product-info");
        infoDiv.innerHTML = `<p>${productName}</p>`;
        item.appendChild(infoDiv);
        productNameElement.style.display = "none";
      }
    });
  }

  // --- 퀴즈 옵션 이벤트 처리 ---
  // (요소가 존재할 때만)
  if (options && options.length > 0) {
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
            resultContainer.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
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

// 이벤트 로그 함수
async function logEvent(eventType, userId, extra = {}) {
  console.log("[logEvent] called with", { eventType, userId, extra });
  const { data, error } = await supabase.from("non_events").insert([
    {
      event_type: eventType,
      user_id: userId,
      event_value: {}, // event_value는 NOT NULL이므로 항상 기본값 입력
      ...extra,
      // created_at은 Supabase에서 자동 생성
    },
  ]);
  if (error) {
    console.error("[logEvent] Supabase insert error:", error);
  } else {
    console.log("[logEvent] Supabase insert success:", data);
  }
}

// 소셜 로그인 트리거 함수
async function signInWithProvider(provider, eventType) {
  try {
    // 현재 페이지로 리다이렉트 (Netlify/Supabase Auth 설정과 일치해야 함)
    const redirectTo = window.location.origin + window.location.pathname;
    console.log("[DEBUG] 현재 origin:", window.location.origin);
    console.log("[DEBUG] 현재 pathname:", window.location.pathname);
    console.log("[DEBUG] 최종 redirectTo:", redirectTo);
    console.log("[OAuth] signInWithProvider 호출", { provider, redirectTo });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      alert("로그인 실패: " + error.message);
      console.error("카카오 로그인 에러:", error);
      return;
    }
    // 로그인 성공 후 유저 정보 받아서 이벤트 로그 기록
    supabase.auth.getUser().then(({ data, error }) => {
      if (data && data.user) {
        logEvent(eventType, data.user.id);
      }
    });
  } catch (e) {
    alert("카카오 로그인 중 예외 발생: " + e.message);
    console.error("카카오 로그인 예외:", e);
  }
}
