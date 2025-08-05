// 사용자가 선택한 답 저장
let userAnswers = [];

// 모바일 디바이스 감지 및 최적화
document.addEventListener("DOMContentLoaded", () => {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // 모바일에서 터치 스크롤 최적화
  if (isMobile) {
    document.body.style.webkitOverflowScrolling = "touch";
    document.body.style.overflowScrolling = "touch";

    // 모바일 터치 하이라이트 제거
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      button, .option {
        touch-action: manipulation !important;
      }
    `;
    document.head.appendChild(style);
  }
});

const logoElem = document.querySelector(".logo");
if (logoElem) {
  logoElem.style.cursor = "pointer";
  logoElem.addEventListener("click", () => {
    window.location.reload();
  });
}

// 기존 HTML의 메뉴 토글 기능 활성화
const menuToggle = document.getElementById("menu-toggle");
const dropdownMenu = document.getElementById("dropdown-menu");

if (menuToggle && dropdownMenu) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
    menuToggle.classList.toggle("active");
  });

  // 바깥 클릭 시 메뉴 닫기
  document.addEventListener("click", (e) => {
    if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      dropdownMenu.classList.remove("show");
      menuToggle.classList.remove("active");
    }
  });
}

// 로딩화면 1.5초 유지 후 숨기기 (opacity 0 → 0.5s 후 display:none, .hidden class도 적용)
const loadingScreen = document.getElementById("loading-screen");
if (loadingScreen) {
  loadingScreen.style.opacity = "1";
  loadingScreen.style.display = "flex";
  loadingScreen.classList.remove("hidden");
  setTimeout(() => {
    loadingScreen.style.transition = "opacity 0.5s";
    loadingScreen.style.opacity = "0";
    loadingScreen.classList.add("hidden");
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }, 1500);
}
// 향수병 채우기 로직 (GSAP 기반, droplet 쌓임 효과)
const bottleFillRect = document.getElementById("bottle-fill-rect");
const bottleDrop = document.getElementById("bottle-drop");
let fillStep = 0;
// 질문 4단계에 맞춰 fillStates도 4단계로 확장
const fillStates = [
  { y: 140, height: 20, color: "#e4c662" }, // 1단계
  { y: 110, height: 50, color: "#e6b98a" }, // 2단계
  { y: 80, height: 80, color: "#bfae9e" }, // 3단계
  { y: 60, height: 110, color: "#d8771c13" }, // 4단계 (가득참)
];
function animateBottleFill() {
  return new Promise((resolve) => {
    if (!bottleFillRect || typeof gsap === "undefined") return resolve();
    // 새로운 droplet 생성 (겹겹이 쌓임)
    const droplet = document.createElement("div");
    droplet.className = "droplet";
    droplet.style.position = "absolute";
    droplet.style.left = "50%";
    droplet.style.top = "30px";
    droplet.style.width = "24px";
    droplet.style.height = "24px";
    droplet.style.background =
      fillStates[fillStep]?.color || fillStates[2].color;
    droplet.style.borderRadius = "50%";
    droplet.style.transform = "translate(-50%, 0) scale(1)";
    droplet.style.opacity = "0";
    droplet.style.zIndex = "3";
    bottleDrop.parentNode.appendChild(droplet);

    // GSAP 애니메이션 (gsap.md 참고)
    gsap.fromTo(
      droplet,
      { y: -100, opacity: 0 },
      {
        y: 110,
        opacity: 1,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          // ripple 효과
          const ripple = document.createElement("div");
          ripple.className = "bottle-ripple";
          droplet.parentNode.appendChild(ripple);
          setTimeout(() => {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
          }, 700);
          // droplet fade out (잔상 남기려면 opacity만 줄이고 제거 X)
          gsap.to(droplet, {
            opacity: 0.7,
            duration: 0.5,
            delay: 0.1,
          });
          // 공병 채우기
          const state = fillStates[fillStep] || fillStates[2];
          gsap.to(bottleFillRect, {
            attr: { y: state.y, height: state.height, fill: state.color },
            duration: 0.6,
            ease: "power1.out",
            onComplete: () => {
              fillStep++;
              resolve();
            },
          });
        },
      }
    );
  });
}

// 질문/선택지 데이터
const quizData = [
  {
    question: "당신은 어떤 단어에 끌리시나요?",
    options: [
      { text: "고요함", img: "./고요함.jpg" },
      { text: "섬세함", img: "./섬세함.jpg" },
      { text: "자유로움", img: "./자유로움.jpg" },
    ],
  },
  {
    question: "당신은 언제 가장 나다워지나요?",
    options: [
      {
        text: "혼자 있는 조용한 시간 속에서",
        img: "./혼자 조용한 시간 속에서.jpg",
      },
      {
        text: "좋아하는 사람들과 감정을 나눌 때",
        img: "./좋아하는 사람들과 감정을 나눌 때.jpg",
      },
      {
        text: "낯선 곳에서 새로운 경험을 할 때",
        img: "./낯선 곳에서 새로운 경험을 할 때.jpg",
      },
    ],
  },
  {
    question: "오래도록 잊혀지지 않는 순간이 있나요?",
    options: [
      { text: "한 문장이 마음을 적신 대화", img: "./onetext.jpg" },
      { text: "오후의 햇살을 따라 걷던 길", img: "./sunsetme.jpg" },
      { text: "그날, 내게 솔직해졌던 밤", img: "./솔직한나.jpg" },
    ],
  },
  {
    question: "당신의 향기가 건넬 수 있다면, 어떤 마음을 담고 싶나요?",
    options: [
      { text: "말없이 나를 이해해주는 속도", img: "./notalk.jpg" },
      { text: "지금 이 순간을 닮은 온기", img: "./rightnow.jpg" },
      { text: "조심스럽지만 진심을 담은 마음", img: "./gift.jpg" },
    ],
  },
];

let currentQuestion = 0;

let isAnimating = false;
function renderQuestion(idx) {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = "";
  if (!quizData[idx]) return;
  const q = quizData[idx];
  const qElem = document.createElement("p");
  qElem.className = "question";
  qElem.textContent = q.question;
  quizContainer.appendChild(qElem);
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.setAttribute("data-value", opt.text);
    if (opt.img) {
      const img = document.createElement("img");
      // 항상 루트(/)에서 이미지 찾도록 경로 보정
      img.src = opt.img.startsWith("/")
        ? opt.img
        : "/" + opt.img.replace(/^\.\//, "");
      img.alt = opt.text;
      img.className = "option-image";
      btn.appendChild(img);
    }
    btn.appendChild(document.createTextNode(opt.text));

    // 클릭 핸들러 함수
    const handleOptionClick = async () => {
      if (isAnimating) return;
      isAnimating = true;
      // 답 저장
      userAnswers[currentQuestion] = opt.text;
      // fillStep이 currentQuestion보다 크면(=이전 질문에서 여러번 클릭 등 꼬임) 강제 동기화
      if (fillStep !== currentQuestion) {
        fillStep = currentQuestion;
      }
      // 이미 채워진 단계라면 애니메이션 생략
      if (fillStep > currentQuestion) {
        nextStep();
        isAnimating = false;
        return;
      }
      await animateBottleFill();
      nextStep();
      isAnimating = false;
    };

    // 클릭 이벤트
    btn.addEventListener("click", handleOptionClick);

    // 터치 이벤트 (모바일 최적화)
    btn.addEventListener("touchend", (e) => {
      e.preventDefault(); // 더블 탭 줌 방지
      handleOptionClick();
    });
    optionsDiv.appendChild(btn);
  });
  quizContainer.appendChild(optionsDiv);

  // 이전으로 버튼 (첫번째 질문 제외)
  if (idx > 0) {
    const backBtn = document.createElement("button");
    backBtn.textContent = "이전으로";
    backBtn.className = "back-btn";
    backBtn.style.marginTop = "2.2rem";
    backBtn.style.background = "rgba(255,255,255,0.13)";
    backBtn.style.color = "#e4c662";
    backBtn.style.border = "none";
    backBtn.style.borderRadius = "1.2rem";
    backBtn.style.padding = "0.7rem 2.2rem";
    backBtn.style.fontSize = "1.1rem";
    backBtn.style.cursor = "pointer";
    backBtn.style.transition = "background 0.2s";
    backBtn.addEventListener("mouseenter", () => {
      backBtn.style.background = "#e4c66222";
    });
    backBtn.addEventListener("mouseleave", () => {
      backBtn.style.background = "rgba(255,255,255,0.13)";
    });
    backBtn.onclick = () => {
      // 이전 답 제거
      userAnswers[idx] = undefined;
      // fillStep도 한 단계 줄임
      if (fillStep > 0) fillStep = idx - 1;
      currentQuestion = idx - 1;
      renderQuestion(currentQuestion);
    };
    quizContainer.appendChild(backBtn);
  }
}

function nextStep() {
  // 3. For Rest: 자유로움 → 낯선 곳 경험 → 솔직했던 밤 → 지금 이 순간의 온기
  const isForRest =
    userAnswers[0] === "자유로움" &&
    userAnswers[1] === "낯선 곳에서 새로운 경험을 할 때" &&
    userAnswers[2] === "그날, 내게 솔직해졌던 밤" &&
    userAnswers[3] === "지금 이 순간을 닮은 온기";
  const quizContainer = document.getElementById("quiz-container");
  const bottleSvg = document.getElementById("perfume-svg");
  const bottleDropDiv = document.getElementById("bottle-drop");
  if (currentQuestion < quizData.length - 1) {
    currentQuestion++;
    renderQuestion(currentQuestion);
  } else {
    // 결과 케이스:
    // 1. Santal Cream: 고요함 → 혼자 있는 조용한 시간 속에서 → 오후의 햇살을 따라 걷던 길 → 말없이 나를 이해해주는 속도
    const isSanatalCream =
      userAnswers[0] === "고요함" &&
      userAnswers[1] === "혼자 있는 조용한 시간 속에서" &&
      userAnswers[2] === "오후의 햇살을 따라 걷던 길" &&
      userAnswers[3] === "말없이 나를 이해해주는 속도";

    // 2. Forget Me Not: 섬세함 → 감정을 나눌 때 → 감정 깊은 대화 → 진심 담은 마음
    const isForgetMeNot =
      userAnswers[0] === "섬세함" &&
      userAnswers[1] === "좋아하는 사람들과 감정을 나눌 때" &&
      userAnswers[2] === "한 문장이 마음을 적신 대화" &&
      userAnswers[3] === "조심스럽지만 진심을 담은 마음";

    // 공병(향수병) 자연스럽게 숨기기 (페이드아웃)
    if (bottleSvg) {
      bottleSvg.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1)";
      bottleSvg.style.opacity = "0";
      setTimeout(() => {
        bottleSvg.style.display = "none";
      }, 800);
    }
    if (bottleDropDiv) {
      // 완전히 숨기기 (opacity + display)
      bottleDropDiv.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1)";
      bottleDropDiv.style.opacity = "0";
      setTimeout(() => {
        bottleDropDiv.style.display = "none";
        bottleDropDiv.style.pointerEvents = "none";
        // 모든 droplet, ripple 요소 제거
        while (bottleDropDiv.firstChild) {
          bottleDropDiv.removeChild(bottleDropDiv.firstChild);
        }
      }, 800);
    }

    // 로딩 화면 (로고 회전 + 문구)
    quizContainer.innerHTML = `
      <div id="result-loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem;min-height:220px;">
        <img id="loading-logo-spin" src="/로고.png" alt="logo" style="width:120px;height:120px;animation:logo-spin 3.2s linear infinite;filter:drop-shadow(0 2px 18px #e4c66255);margin-bottom:0.5rem;" />
        <span style="font-size:1.35rem;color:#e4c662;letter-spacing:0.04em;">향을 찾는 중입니다<span class="result-ellipsis">...</span></span>
      </div>
    `;
    // 로고 회전 keyframes 추가 (한 번만 추가)
    if (!document.getElementById("logo-spin-keyframes")) {
      const style = document.createElement("style");
      style.id = "logo-spin-keyframes";
      style.innerHTML = `@keyframes logo-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
      document.head.appendChild(style);
    }
    // 1.5초 후 결과 표시
    setTimeout(() => {
      // 결과 컨테이너 비우기
      quizContainer.innerHTML = "";
      // 결과에서도 공병 숨김 유지
      if (bottleSvg) {
        bottleSvg.style.display = "none";
      }
      if (bottleDropDiv) {
        bottleDropDiv.style.display = "none";
        bottleDropDiv.style.opacity = "0";
        bottleDropDiv.style.pointerEvents = "none";
        // 모든 droplet, ripple 요소 제거 (혹시 남아있을 경우)
        while (bottleDropDiv.firstChild) {
          bottleDropDiv.removeChild(bottleDropDiv.firstChild);
        }
      }
      // bottle-drop이 숨겨질 때 완전히 안보이도록 보조 CSS 추가 (한 번만)
      if (!document.getElementById("bottle-drop-hide-style")) {
        const style = document.createElement("style");
        style.id = "bottle-drop-hide-style";
        style.innerHTML = `.bottle-drop[style*="display: none"] { opacity: 0 !important; pointer-events: none !important; }`;
        document.head.appendChild(style);
      }
      if (isSanatalCream) {
        // Santal Cream 결과
        const resultBox = document.createElement("div");
        resultBox.style.margin = "3.5rem auto 0 auto";
        resultBox.style.maxWidth = "420px";
        resultBox.style.background = "rgba(255,255,255,0.07)";
        resultBox.style.borderRadius = "1.2rem";
        resultBox.style.padding = "2.2rem 1.6rem 1.6rem 1.6rem";
        resultBox.style.boxShadow = "0 2px 24px #2222, 0 0 8px #e4c66233";
        resultBox.style.color = "#fff";
        resultBox.style.display = "flex";
        resultBox.style.flexDirection = "column";
        resultBox.style.alignItems = "center";
        resultBox.style.fontSize = "1.15rem";
        resultBox.style.opacity = "0";
        quizContainer.appendChild(resultBox);
        // fade in
        setTimeout(() => {
          resultBox.style.opacity = "1";
        }, 100);
        // 이미지
        const img = document.createElement("img");
        img.src = "/santalcream.jpg";
        img.alt = "Sanatal Cream";
        img.style.width = "240px";
        img.style.borderRadius = "1.2rem";
        img.style.marginBottom = "1.1rem";
        img.style.opacity = "0";
        img.style.transition = "opacity 1.2s";
        img.style.boxShadow = "0 4px 32px #e4c66233, 0 2px 8px #2222";
        setTimeout(() => {
          img.style.opacity = "1";
        }, 200);
        resultBox.appendChild(img);
        // 타이틀
        const title = document.createElement("div");
        title.innerHTML = "Sanatal Cream";
        title.style.fontSize = "1.5rem";
        title.style.fontWeight = "bold";
        title.style.color = "#e4c662";
        title.style.marginBottom = "0.7rem";
        title.style.letterSpacing = "0.04em";
        resultBox.appendChild(title);
        // 노트
        const notes = document.createElement("div");
        notes.innerHTML =
          '<span style="font-weight:bold;">Top Note</span>: Fig, Cardamom<br><span style="font-weight:bold;">Middle Note</span>: Vetiver, Sandalwood<br><span style="font-weight:bold;">Base Note</span>: Creamy wood';
        notes.style.marginBottom = "0.7rem";
        resultBox.appendChild(notes);
        // 설명 (타이핑 효과)
        const desc = document.createElement("div");
        desc.style.marginBottom = "0.2rem";
        desc.style.lineHeight = "1.7";
        desc.style.minHeight = "4.5em";
        resultBox.appendChild(desc);
        const descText =
          "바쁜 세상 속에서도 당신은 조용히 자신을 들여다보는 사람입니다.\n오후 햇살이 길 위를 부드럽게 쓰다듬을 때처럼, 이 향은 당신의 고요한 마음을 감싸 안습니다.\n부드러운 무화과 향과 따뜻한 우드 노트가 겹겹이 쌓여, 아무 말 없이 곁에 머물러 주는 위로가 되어줍니다.";
        desc.textContent = "";
        let i = 0;
        function typeWriter() {
          if (i < descText.length) {
            desc.textContent += descText[i] === "\n" ? "\n" : descText[i];
            i++;
            setTimeout(typeWriter, descText[i - 1] === "." ? 120 : 60);
          } else {
            addResultButtons(resultBox);
          }
        }
        typeWriter();
      } else if (isForgetMeNot) {
        // Forget Me Not 결과
        const resultBox = document.createElement("div");
        resultBox.style.margin = "3.5rem auto 0 auto";
        resultBox.style.maxWidth = "420px";
        resultBox.style.background = "rgba(255,255,255,0.07)";
        resultBox.style.borderRadius = "1.2rem";
        resultBox.style.padding = "2.2rem 1.6rem 1.6rem 1.6rem";
        resultBox.style.boxShadow = "0 2px 24px #2222, 0 0 8px #e4c66233";
        resultBox.style.color = "#fff";
        resultBox.style.display = "flex";
        resultBox.style.flexDirection = "column";
        resultBox.style.alignItems = "center";
        resultBox.style.fontSize = "1.15rem";
        resultBox.style.opacity = "0";
        quizContainer.appendChild(resultBox);
        setTimeout(() => {
          resultBox.style.opacity = "1";
        }, 100);
        // 이미지
        const img = document.createElement("img");
        img.src = "/포게미낫.jpg";
        img.alt = "Forget Me Not";
        img.style.width = "240px";
        img.style.borderRadius = "1.2rem";
        img.style.marginBottom = "1.1rem";
        img.style.opacity = "0";
        img.style.transition = "opacity 1.2s";
        img.style.boxShadow = "0 4px 32px #e4c66233, 0 2px 8px #2222";
        setTimeout(() => {
          img.style.opacity = "1";
        }, 200);
        resultBox.appendChild(img);
        // 타이틀
        const title = document.createElement("div");
        title.innerHTML = "Forget Me Not";
        title.style.fontSize = "1.5rem";
        title.style.fontWeight = "bold";
        title.style.color = "#e4c662";
        title.style.marginBottom = "0.7rem";
        title.style.letterSpacing = "0.04em";
        resultBox.appendChild(title);
        // 노트
        const notes = document.createElement("div");
        notes.innerHTML =
          '<span style="font-weight:bold;">Top Note</span>: Basil, Pink Pepper<br><span style="font-weight:bold;">Middle Note</span>: Gardenia, Green Accord<br><span style="font-weight:bold;">Base Note</span>: Amber';
        notes.style.marginBottom = "0.7rem";
        resultBox.appendChild(notes);
        // 설명 (타이핑 효과)
        const desc = document.createElement("div");
        desc.style.marginBottom = "0.2rem";
        desc.style.lineHeight = "1.7";
        desc.style.minHeight = "4.5em";
        resultBox.appendChild(desc);
        const descText =
          "당신은 쉽게 지나치지 않습니다. 한마디 말에도, 한 번의 눈빛에도 마음을 기울이는 사람입니다. 이 향은 그런 당신의 섬세함을 닮았습니다. 가드니아와 핑크 페퍼가 스치듯 감정을 자극하고, 앰버의 깊이가 진심을 오래도록 머물게 하죠. 향기로 누군가에게 조심스럽게 마음을 건네는 순간, 이 향이 함께합니다.";
        desc.textContent = "";
        let i = 0;
        function typeWriter() {
          if (i < descText.length) {
            desc.textContent += descText[i] === "\n" ? "\n" : descText[i];
            i++;
            setTimeout(typeWriter, descText[i - 1] === "." ? 120 : 60);
          } else {
            addResultButtons(resultBox);
          }
        }
        typeWriter();
      } else if (isForRest) {
        // For Rest 결과
        const resultBox = document.createElement("div");
        resultBox.style.margin = "3.5rem auto 0 auto";
        resultBox.style.maxWidth = "420px";
        resultBox.style.background = "rgba(255,255,255,0.07)";
        resultBox.style.borderRadius = "1.2rem";
        resultBox.style.padding = "2.2rem 1.6rem 1.6rem 1.6rem";
        resultBox.style.boxShadow = "0 2px 24px #2222, 0 0 8px #e4c66233";
        resultBox.style.color = "#fff";
        resultBox.style.display = "flex";
        resultBox.style.flexDirection = "column";
        resultBox.style.alignItems = "center";
        resultBox.style.fontSize = "1.15rem";
        resultBox.style.opacity = "0";
        quizContainer.appendChild(resultBox);
        setTimeout(() => {
          resultBox.style.opacity = "1";
        }, 100);
        // 이미지
        const img = document.createElement("img");
        img.src = "/forrest.jpg";
        img.alt = "For Rest";
        img.style.width = "240px";
        img.style.borderRadius = "1.2rem";
        img.style.marginBottom = "1.1rem";
        img.style.opacity = "0";
        img.style.transition = "opacity 1.2s";
        img.style.boxShadow = "0 4px 32px #e4c66233, 0 2px 8px #2222";
        setTimeout(() => {
          img.style.opacity = "1";
        }, 200);
        resultBox.appendChild(img);
        // 타이틀
        const title = document.createElement("div");
        title.innerHTML = "For Rest";
        title.style.fontSize = "1.5rem";
        title.style.fontWeight = "bold";
        title.style.color = "#e4c662";
        title.style.marginBottom = "0.7rem";
        title.style.letterSpacing = "0.04em";
        resultBox.appendChild(title);
        // 노트
        const notes = document.createElement("div");
        notes.innerHTML =
          '<span style="font-weight:bold;">Top Note</span>: Yuzu, Hinoki<br><span style="font-weight:bold;">Middle Note</span>: Nutmeg, Frankincense<br><span style="font-weight:bold;">Base Note</span>: Mineral, Woody';
        notes.style.marginBottom = "0.7rem";
        resultBox.appendChild(notes);
        // 설명 (타이핑 효과)
        const desc = document.createElement("div");
        desc.style.marginBottom = "0.2rem";
        desc.style.lineHeight = "1.7";
        desc.style.minHeight = "4.5em";
        resultBox.appendChild(desc);
        const descText =
          "당신은 틀에 갇히길 거부하고, 매일의 경계를 넘나듭니다. 새벽 공기를 품은 히노키 향은 익숙함을 떠나 낯선 곳을 향해 나아가는 용기를 닮았고, 유자의 맑고 선명한 향은 지금 이 순간에 집중하는 당신의 감각을 깨웁니다. 이 향은 정해진 틀 없이 자유롭게 흘러가려는 당신의 하루를 담고 있습니다.";
        desc.textContent = "";
        let i = 0;
        function typeWriter() {
          if (i < descText.length) {
            desc.textContent += descText[i] === "\n" ? "\n" : descText[i];
            i++;
            setTimeout(typeWriter, descText[i - 1] === "." ? 120 : 60);
          } else {
            addResultButtons(resultBox);
          }
        }
        typeWriter();
      } else {
        // Gentle Night 결과 (기본)
        const resultBox = document.createElement("div");
        resultBox.style.margin = "3.5rem auto 0 auto";
        resultBox.style.maxWidth = "420px";
        resultBox.style.background = "rgba(255,255,255,0.07)";
        resultBox.style.borderRadius = "1.2rem";
        resultBox.style.padding = "2.2rem 1.6rem 1.6rem 1.6rem";
        resultBox.style.boxShadow = "0 2px 24px #2222, 0 0 8px #e4c66233";
        resultBox.style.color = "#fff";
        resultBox.style.display = "flex";
        resultBox.style.flexDirection = "column";
        resultBox.style.alignItems = "center";
        resultBox.style.fontSize = "1.15rem";
        resultBox.style.opacity = "0";
        quizContainer.appendChild(resultBox);
        setTimeout(() => {
          resultBox.style.opacity = "1";
        }, 100);
        // 이미지
        const img = document.createElement("img");
        img.src = "/젠틀나잇.jpg";
        img.alt = "Gentle Night";
        img.style.width = "240px";
        img.style.borderRadius = "1.2rem";
        img.style.marginBottom = "1.1rem";
        img.style.opacity = "0";
        img.style.transition = "opacity 1.2s";
        img.style.boxShadow = "0 4px 32px #e4c66233, 0 2px 8px #2222";
        setTimeout(() => {
          img.style.opacity = "1";
        }, 200);
        resultBox.appendChild(img);
        // 타이틀
        const title = document.createElement("div");
        title.innerHTML = "Gentle Night";
        title.style.fontSize = "1.5rem";
        title.style.fontWeight = "bold";
        title.style.color = "#e4c662";
        title.style.marginBottom = "0.7rem";
        title.style.letterSpacing = "0.04em";
        resultBox.appendChild(title);
        // 노트
        const notes = document.createElement("div");
        notes.innerHTML =
          '<span style="font-weight:bold;">Top Note</span>: Green Tea, Violet<br><span style="font-weight:bold;">Middle Note</span>: Cedarwood, Moss<br><span style="font-weight:bold;">Base Note</span>: Musk, Vanilla';
        notes.style.marginBottom = "0.7rem";
        resultBox.appendChild(notes);
        // 설명 (타이핑 효과)
        const desc = document.createElement("div");
        desc.style.marginBottom = "0.2rem";
        desc.style.lineHeight = "1.7";
        desc.style.minHeight = "4.5em";
        resultBox.appendChild(desc);
        const descText =
          "“당신이 고른 모든 선택은, 부드럽지만 깊은 울림을 남기는 하나의 서사로 이어집니다.”\nGentle Night는 그 이야기에 말없는 공감과 온기를 덧입힙니다.\n따뜻한 바닐라와 머스크, 그리고 차분한 시더우드가 감정을 부드럽게 만들어 주며 \n당신의 진심을 말없이 드러내는 본질을 나타냅니다.";
        desc.textContent = "";
        let i = 0;
        function typeWriter() {
          if (i < descText.length) {
            desc.textContent += descText[i] === "\n" ? "\n" : descText[i];
            i++;
            setTimeout(typeWriter, descText[i - 1] === "." ? 120 : 60);
          } else {
            addResultButtons(resultBox);
          }
        }
        typeWriter();
      }
    }, 1500);
  }
} // ← nextStep 함수 닫는 중괄호 추가

// 결과 화면에 버튼 2개 추가 함수 (공통, 모든 결과에서 사용)
function addResultButtons(container) {
  const btnWrap = document.createElement("div");
  btnWrap.style.display = "flex";
  btnWrap.style.gap = "1.2rem";
  btnWrap.style.justifyContent = "center";
  btnWrap.style.marginTop = "1.7rem";

  // 상품 페이지 버튼
  const productBtn = document.createElement("button");
  productBtn.textContent = "상품 페이지";
  productBtn.className = "result-btn";
  productBtn.style.background = "#e4c662";
  productBtn.style.color = "#222";
  productBtn.style.border = "none";
  productBtn.style.borderRadius = "1.2rem";
  productBtn.style.padding = "0.8rem 2.2rem";
  productBtn.style.fontSize = "1.08rem";
  productBtn.style.fontWeight = "bold";
  productBtn.style.cursor = "pointer";
  productBtn.style.boxShadow = "0 2px 12px #e4c66233";
  productBtn.style.transition = "background 0.2s";
  productBtn.onmouseenter = () => {
    productBtn.style.background = "#f7e7a6";
  };
  productBtn.onmouseleave = () => {
    productBtn.style.background = "#e4c662";
  };
  // 모바일 터치 최적화
  productBtn.style.webkitTapHighlightColor = "transparent";
  productBtn.style.touchAction = "manipulation";
  // TODO: 상품 페이지 링크 연결 필요
  btnWrap.appendChild(productBtn);

  // 모두의 단어 보기 버튼
  const wordsBtn = document.createElement("button");
  wordsBtn.textContent = "모두의 단어 보기";
  wordsBtn.className = "result-btn";
  wordsBtn.style.background = "rgba(255,255,255,0.13)";
  wordsBtn.style.color = "#e4c662";
  wordsBtn.style.border = "none";
  wordsBtn.style.borderRadius = "1.2rem";
  wordsBtn.style.padding = "0.8rem 2.2rem";
  wordsBtn.style.fontSize = "1.08rem";
  wordsBtn.style.fontWeight = "bold";
  wordsBtn.style.cursor = "pointer";
  wordsBtn.style.boxShadow = "0 2px 12px #e4c66233";
  wordsBtn.style.transition = "background 0.2s";
  wordsBtn.onmouseenter = () => {
    wordsBtn.style.background = "#e4c66222";
  };
  wordsBtn.onmouseleave = () => {
    wordsBtn.style.background = "rgba(255,255,255,0.13)";
  };
  // 모바일 터치 최적화
  wordsBtn.style.webkitTapHighlightColor = "transparent";
  wordsBtn.style.touchAction = "manipulation";
  // TODO: 모두의 단어 보기 링크 연결 필요
  btnWrap.appendChild(wordsBtn);

  container.appendChild(btnWrap);
}

// 첫 질문 렌더링
renderQuestion(currentQuestion);
