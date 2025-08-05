import "./style.css";
import Matter from "matter-js";

class FallingText {
  constructor(options = {}) {
    this.container = options.container;
    this.text =
      options.text ||
      "고요함 섬세함 자유로움 새로운 경험 감정 조용한 시간 대화 솔직함 햇살 진심 온기";
    this.highlightWords = options.highlightWords || [
      "luxury",
      "black",
      "white",
      "pink",
      "male",
      "female",
    ];
    this.highlightClass = options.highlightClass || "highlighted";
    this.trigger = options.trigger || "click";
    this.backgroundColor = options.backgroundColor || "transparent";
    this.wireframes = options.wireframes || false;
    this.gravity = options.gravity || 0.56;
    this.fontSize = options.fontSize || "2rem";
    this.mouseConstraintStiffness = options.mouseConstraintStiffness || 0.9;
    this.basketArea = options.basketArea || null;

    this.engine = null;
    this.render = null;
    this.runner = null;
    this.animationId = null;
    this.wordBodies = [];

    this.init();
  }

  init() {
    this.createHTML();
    this.setupText();
    this.setupTrigger();
  }

  createHTML() {
    this.container.innerHTML = `
      <div class="falling-text-container" style="pointer-events: none;">
        <div class="falling-text-target" style="font-size: ${
          this.fontSize
        }; line-height: 1.4; pointer-events: auto;"></div>
        <div class="falling-text-canvas" style="z-index:1;"></div>
        ${this.basketArea ? `<div class="basket-area"></div>` : ""}
      </div>
    `;

    // 향수병 스타일 별도 적용
    if (this.basketArea) {
      const basketEl = this.container.querySelector(".basket-area");
      if (basketEl) {
        basketEl.style.left = `${this.basketArea.x}px`;
        basketEl.style.top = `${this.basketArea.y}px`;
        basketEl.style.width = `${this.basketArea.width}px`;
        basketEl.style.height = `${this.basketArea.height}px`;
      }
    }
    this.containerEl = this.container.querySelector(".falling-text-container");
    this.textEl = this.container.querySelector(".falling-text-target");
    this.canvasEl = this.container.querySelector(".falling-text-canvas");
    this.basketEl = this.container.querySelector(".basket-area");
  }

  setupText() {
    const words = this.text.split(" ");
    const userChoices = ["자유로움", "햇살", "진심"]; // 사용자가 선택한 단어 (임시)

    // 단어별 색상/스타일 매핑
    const colorMap = {
      고요함: "#b6a6e6",
      섬세함: "#e6a6c7",
      자유로움: "#e6c86b",
      "새로운 경험": "#6b8be6",
      감정: "#e6b68a",
      "조용한 시간": "#bdb7a7",
      대화: "#e6a6c7",
      솔직함: "#e6c86b",
      햇살: "#ffe066",
      진심: "#b6a6e6",
      온기: "#e6a6c7",
    };
    const bigWords = ["고요함", "자유로움", "온기"];
    const newHTML = words
      .map((word) => {
        const color = colorMap[word] || "#222";
        const isBig = bigWords.includes(word);
        const isUserChoice = userChoices.includes(word);
        const className = `word${isBig ? " highlighted" : ""}${
          isUserChoice ? " user-choice" : ""
        }`;

        return `<span class="${className}" style="color:${color};${
          isBig ? "font-size:2.6rem;font-weight:bold;" : "font-size:2rem;"
        }">${word}</span>`;
      })
      .join(" ");
    this.textEl.innerHTML = newHTML;
    setTimeout(() => this.storeOriginalPositions(), 0);
  }

  storeOriginalPositions() {
    const containerRect = this.containerEl.getBoundingClientRect();
    const words = this.textEl.querySelectorAll(".word");
    let baseX = null,
      baseY = null;
    if (this.basketArea) {
      // 향수병 중앙 상단에서 떨어지도록
      baseX = this.basketArea.x + this.basketArea.width / 2;
      baseY = this.basketArea.y + 30; // 테두리 위쪽에서 살짝 아래
    }
    words.forEach((wordEl, idx) => {
      const rect = wordEl.getBoundingClientRect();
      let x, y;
      if (baseX !== null && baseY !== null) {
        // 단어들이 겹치지 않게 x축에 약간씩 분산
        const spread = Math.min(this.basketArea.width * 0.7, 240);
        x = baseX + (idx - (words.length - 1) / 2) * (spread / words.length);
        y = baseY;
      } else {
        x = rect.left - containerRect.left + rect.width / 2;
        y = rect.top - containerRect.top + rect.height / 2;
      }
      wordEl.dataset.originalX = x;
      wordEl.dataset.originalY = y;
      wordEl.dataset.originalWidth = rect.width;
      wordEl.dataset.originalHeight = rect.height;
    });
  }

  setupTrigger() {
    if (this.trigger === "click") {
      this.setupWordClickListeners();
    } else if (this.trigger === "auto") {
      // 모든 단어 자동 낙하
      setTimeout(() => {
        const allWords = this.textEl.querySelectorAll(".word");
        allWords.forEach((wordEl) => {
          this.dropSingleWord(wordEl);
        });
      }, 100);
    }
  }

  setupWordClickListeners() {
    const highlightedWords = this.textEl.querySelectorAll(".word.highlighted");
    highlightedWords.forEach((wordEl) => {
      wordEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dropSingleWord(wordEl);
      });
    });
  }

  dropSingleWord(wordEl) {
    if (wordEl.dataset.dropped === "true") return;
    wordEl.dataset.dropped = "true";
    if (!this.engine) this.initPhysicsEngine();

    const placeholder = document.createElement("span");
    placeholder.className = wordEl.className;
    placeholder.style.visibility = "hidden";
    placeholder.textContent = wordEl.textContent;
    wordEl.parentNode.insertBefore(placeholder, wordEl);

    // 단어 요소의 크기
    const width = parseFloat(wordEl.dataset.originalWidth);
    const height = parseFloat(wordEl.dataset.originalHeight);

    // 향수병 영역 내에서 랜덤한 위치 설정
    let x, y;
    if (this.basketArea) {
      // 병 내부 안쪽으로 조금 여유를 두고 배치
      const margin = Math.max(width, height) / 2;
      x =
        this.basketArea.x +
        margin +
        Math.random() * (this.basketArea.width - margin * 2);
      y =
        this.basketArea.y +
        margin +
        Math.random() * (this.basketArea.height * 0.3);
    } else {
      x = parseFloat(wordEl.dataset.originalX);
      y = parseFloat(wordEl.dataset.originalY);
    }

    const body = Matter.Bodies.rectangle(x, y, width, height, {
      render: { fillStyle: "transparent" },
      restitution: 0.5, // 튕김 효과 감소
      frictionAir: 0.02, // 공기 마찰 증가
      friction: 0.1, // 마찰 감소
    });

    // 초기 속도 설정
    let initialVelocity;
    if (this.basketArea) {
      initialVelocity = {
        x: (Math.random() - 0.5) * 1, // 좌우 움직임 감소
        y: Math.random() * 0.5, // 천천히 떨어지도록
      };
    } else {
      initialVelocity = {
        x: (Math.random() - 0.5) * 5,
        y: 0,
      };
    }

    Matter.Body.setVelocity(body, initialVelocity);
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

    wordEl.style.position = "absolute";
    wordEl.style.left = `${x}px`;
    wordEl.style.top = `${y}px`;
    wordEl.style.transform = "translate(-50%, -50%)";
    wordEl.style.zIndex = "10";

    this.wordBodies.push({ elem: wordEl, body, placeholder });
    Matter.World.add(this.engine.world, [body]);
    if (!this.animationId) this.startUpdateLoop();
  }

  initPhysicsEngine() {
    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } =
      Matter;
    const containerRect = this.containerEl.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    this.engine = Engine.create();
    this.engine.world.gravity.y = this.gravity;

    this.render = Render.create({
      element: this.canvasEl,
      engine: this.engine,
      options: {
        width,
        height,
        background: this.backgroundColor,
        wireframes: this.wireframes,
      },
    });

    if (this.render.canvas) {
      this.render.canvas.style.pointerEvents = "none";
      this.render.canvas.style.zIndex = "-1";
    }

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };

    let boundaries = [];
    if (this.basketArea) {
      const basketLeft = this.basketArea.x;
      const basketTop = this.basketArea.y;
      const basketRight = this.basketArea.x + this.basketArea.width;
      const basketBottom = this.basketArea.y + this.basketArea.height;

      // 향수병 내부에 벽 생성 - 경계를 병 안쪽으로 조금 더 넣어서 단어가 튀어나오지 않게 함
      const basketFloor = Bodies.rectangle(
        basketLeft + this.basketArea.width / 2,
        basketBottom - 10,
        this.basketArea.width - 30,
        10,
        boundaryOptions
      );

      const basketLeftWall = Bodies.rectangle(
        basketLeft + 15,
        basketTop + this.basketArea.height / 2,
        10,
        this.basketArea.height - 30,
        boundaryOptions
      );

      const basketRightWall = Bodies.rectangle(
        basketRight - 15,
        basketTop + this.basketArea.height / 2,
        10,
        this.basketArea.height - 30,
        boundaryOptions
      );

      const basketCeiling = Bodies.rectangle(
        basketLeft + this.basketArea.width / 2,
        basketTop + 15,
        this.basketArea.width - 30,
        10,
        boundaryOptions
      );

      boundaries = [
        basketFloor,
        basketLeftWall,
        basketRightWall,
        basketCeiling,
      ];
    } else {
      const floor = Bodies.rectangle(
        width / 2,
        height + 25,
        width,
        50,
        boundaryOptions
      );
      const leftWall = Bodies.rectangle(
        -25,
        height / 2,
        50,
        height,
        boundaryOptions
      );
      const rightWall = Bodies.rectangle(
        width + 25,
        height / 2,
        50,
        height,
        boundaryOptions
      );
      const ceiling = Bodies.rectangle(
        width / 2,
        -25,
        width,
        50,
        boundaryOptions
      );
      boundaries = [floor, leftWall, rightWall, ceiling];
    }

    const mouse = Mouse.create(this.containerEl);
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: {
        stiffness: this.mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    this.render.mouse = mouse;

    World.add(this.engine.world, [...boundaries, mouseConstraint]);
    this.runner = Runner.create();
    // ...기존 FallingText 클래스 내부 코드...
    Runner.run(this.runner, this.engine);
    Render.run(this.render);
  }

  startUpdateLoop() {
    const updateLoop = () => {
      this.wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        const elemWidth = elem.offsetWidth;
        const elemHeight = elem.offsetHeight;

        // 향수병 경계 내에 유지하기
        if (this.basketArea) {
          const basketLeft = this.basketArea.x + elemWidth / 2;
          const basketRight =
            this.basketArea.x + this.basketArea.width - elemWidth / 2;
          const basketTop = this.basketArea.y + elemHeight / 2;
          const basketBottom =
            this.basketArea.y + this.basketArea.height - elemHeight / 2;

          let positionChanged = false;
          let newPosition = { x, y };
          let newVelocity = { x: body.velocity.x, y: body.velocity.y };

          // 좌우 경계 확인 및 반동 적용
          if (x < basketLeft) {
            newPosition.x = basketLeft;
            newVelocity.x = Math.abs(body.velocity.x) * 0.5; // 반대 방향으로 튕기되 속도 감소
            positionChanged = true;
          } else if (x > basketRight) {
            newPosition.x = basketRight;
            newVelocity.x = -Math.abs(body.velocity.x) * 0.5;
            positionChanged = true;
          }

          // 상하 경계 확인 및 반동 적용
          if (y < basketTop) {
            newPosition.y = basketTop;
            newVelocity.y = Math.abs(body.velocity.y) * 0.5;
            positionChanged = true;
          } else if (y > basketBottom) {
            newPosition.y = basketBottom;
            newVelocity.y = -Math.abs(body.velocity.y) * 0.5;
            positionChanged = true;
          }

          // 위치나 속도가 변경되었다면 물리 엔진에 적용
          if (positionChanged) {
            Matter.Body.setPosition(body, newPosition);
            Matter.Body.setVelocity(body, newVelocity);
          }
        }

        // 위치 업데이트
        elem.style.left = `${body.position.x}px`;
        elem.style.top = `${body.position.y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });

      Matter.Engine.update(this.engine);
      this.animationId = requestAnimationFrame(updateLoop);
    };
    updateLoop();
  }
}

// 중앙 박스 크기 지정 - 반응형으로 계산
function calculateResponsiveBoxSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 화면 크기에 따라 박스 크기 조절
  let boxWidth, boxHeight, boxX, boxY;

  if (screenWidth < 480) {
    // 모바일
    boxWidth = Math.min(300, screenWidth * 0.85);
    boxHeight = boxWidth * 0.52;
    boxX = (screenWidth - boxWidth) / 2;
    boxY = 120;
  } else if (screenWidth < 768) {
    // 태블릿
    boxWidth = Math.min(500, screenWidth * 0.7);
    boxHeight = boxWidth * 0.52;
    boxX = (screenWidth - boxWidth) / 2;
    boxY = 150;
  } else {
    // 데스크톱
    boxWidth = Math.min(700, screenWidth * 0.6);
    boxHeight = boxWidth * 0.52;
    boxX = (screenWidth - boxWidth) / 2;
    boxY = 200;
  }

  return { boxWidth, boxHeight, boxX, boxY };
}

// 반응형 크기 및 위치 계산
const { boxWidth, boxHeight, boxX, boxY } = calculateResponsiveBoxSize();

// FallingText 초기화 함수
function initFallingText(boxSize) {
  const { boxX, boxY, boxWidth, boxHeight } =
    boxSize || calculateResponsiveBoxSize();
  const demoDiv = document.querySelector("#falling-text-demo");

  // 기존에 있던 falling-text 요소를 제거하고 재생성
  if (demoDiv) {
    demoDiv.innerHTML = "";

    // 디바이스 크기에 따라 글자 크기 조정
    const screenWidth = window.innerWidth;
    let fontSize = "1.8rem";
    let gravity = 0.3;

    if (screenWidth < 480) {
      fontSize = "1.2rem"; // 모바일
      gravity = 0.2;
    } else if (screenWidth < 768) {
      fontSize = "1.5rem"; // 태블릿
      gravity = 0.25;
    }

    // 떨어지는 단어 개수 조정 (모바일에서는 더 적게)
    const words =
      screenWidth < 480
        ? "고요함 섬세함 자유로움 대화 진심 온기"
        : "고요함 섬세함 자유로움 새로운 경험 감정 조용한 시간 대화 솔직함 햇살 진심 온기 Gentle Night For rest Forget Me Not Santal Cream";

    // 향수병 영역 계산 (모바일에서도 잘 보이게)
    const demoRect = demoDiv.getBoundingClientRect();
    const bottleSize = Math.min(
      demoRect.width * 0.8,
      demoRect.height * 0.8,
      boxWidth
    );
    const bottleX = (demoRect.width - bottleSize) / 2; // 중앙 정렬
    const bottleY = (demoRect.height - bottleSize * 1.2) / 2; // 중앙 정렬

    // FallingText 생성
    const fallingTextInstance = new FallingText({
      container: demoDiv,
      text: words,
      highlightWords: [
        "고요함",
        "자유로움",
        "온기",
        "GentleNight",
        "SantalCream",
      ],
      highlightClass: "highlighted",
      trigger: "auto",
      backgroundColor: "transparent",
      wireframes: false,
      gravity: gravity,
      fontSize: fontSize,
      mouseConstraintStiffness: 0.5,
      basketArea: {
        x: bottleX,
        y: bottleY,
        width: bottleSize,
        height: bottleSize * 1.2,
      },
    });

    console.log("향수병 영역 설정:", {
      x: bottleX,
      y: bottleY,
      width: bottleSize,
      height: bottleSize * 1.2,
    });
  }
}

// 윈도우 크기 변경 시 요소 위치 재계산
window.addEventListener("resize", () => {
  // 일정 간격으로 debounce 된 resize 이벤트만 처리
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    console.log("화면 크기 변경, 컴포넌트 재초기화...");

    // FallingText 데모 컨테이너 높이 조정
    const screenWidth = window.innerWidth;
    const demoDiv = document.querySelector("#falling-text-demo");

    if (demoDiv) {
      if (screenWidth < 480) {
        demoDiv.style.height = "300px"; // 모바일
      } else if (screenWidth < 768) {
        demoDiv.style.height = "350px"; // 태블릿
      } else {
        demoDiv.style.height = "400px"; // 데스크탑
      }
    }

    const newValues = calculateResponsiveBoxSize();

    // 향수병 위치 업데이트
    updateBottlePosition(newValues);

    // 도넛 차트와 프로그레스 바 위치 조정
    adjustChartAndProgressPosition();

    // FallingText 전체 재초기화
    console.log("FallingText 재초기화 중...");
    initFallingText(newValues);
  }, 350); // 더 긴 디바운스 시간으로 성능 향상
});

// 배경색 변경

document.body.style.background = "#f7f5f2";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.height = "100vh";
document.body.style.minHeight = "100vh";

// 좌측 상단 NONFICTION, 우측 상단 햄버거/SHOP/ABOUT
const uiBar = document.createElement("div");
uiBar.style.position = "fixed";
uiBar.style.top = "0";
uiBar.style.left = "0";
uiBar.style.width = "100vw";
uiBar.style.height = "56px";
uiBar.style.display = "flex";
uiBar.style.alignItems = "center";
uiBar.style.justifyContent = "space-between";
uiBar.style.background = "transparent";
uiBar.style.zIndex = "1000";
uiBar.style.pointerEvents = "none";

const nfText = document.createElement("span");
nfText.textContent = "NONFICTION";
nfText.style.fontWeight = "bold";
nfText.style.fontSize = "1.25rem";
nfText.style.letterSpacing = "0.08em";
nfText.style.color = "#222";
nfText.style.marginLeft = "24px";
nfText.style.pointerEvents = "auto";
nfText.style.cursor = "pointer";
nfText.addEventListener("click", () => window.location.reload());

// 우측 버튼 그룹
const rightBox = document.createElement("div");
rightBox.style.display = "flex";
rightBox.style.alignItems = "center";
rightBox.style.gap = "32px";
rightBox.style.marginRight = "32px";
rightBox.style.pointerEvents = "auto";

// 햄버거 메뉴
const menuBtn = document.createElement("button");
menuBtn.setAttribute("aria-label", "menu");
menuBtn.style.background = "none";
menuBtn.style.border = "none";
menuBtn.style.display = "flex";
menuBtn.style.flexDirection = "column";
menuBtn.style.justifyContent = "center";
menuBtn.style.alignItems = "center";
menuBtn.style.width = "36px";
menuBtn.style.height = "36px";
menuBtn.style.cursor = "pointer";
menuBtn.style.padding = "0";
menuBtn.style.marginRight = "8px";
menuBtn.style.pointerEvents = "auto";

function createHamburgerIcon() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 3; i++) {
    const bar = document.createElement("div");
    bar.style.width = "28px";
    bar.style.height = "4px";
    bar.style.background = "#222";
    bar.style.margin = "2.5px 0";
    bar.style.borderRadius = "2px";
    frag.appendChild(bar);
  }
  return frag;
}

function createCloseIcon() {
  const close = document.createElement("div");
  close.style.position = "relative";
  close.style.width = "28px";
  close.style.height = "28px";
  close.style.display = "flex";
  close.style.alignItems = "center";
  close.style.justifyContent = "center";
  close.style.pointerEvents = "none";
  for (let i = 0; i < 2; i++) {
    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.width = "28px";
    line.style.height = "4px";
    line.style.background = "#222";
    line.style.borderRadius = "2px";
    line.style.top = "12px";
    line.style.left = "0";
    line.style.transform = i === 0 ? "rotate(45deg)" : "rotate(-45deg)";
    close.appendChild(line);
  }
  return close;
}

function setMenuBtnToHamburger() {
  menuBtn.innerHTML = "";
  menuBtn.appendChild(createHamburgerIcon());
}

function setMenuBtnToClose() {
  menuBtn.innerHTML = "";
  menuBtn.appendChild(createCloseIcon());
}

setMenuBtnToHamburger();

let menuOpen = false;
function openMenu() {
  menuOverlay.style.display = "flex";
  setTimeout(() => {
    menuOverlay.style.transform = "translateX(0)";
  }, 10);
  menuOpen = true;
}
function closeMenu() {
  menuOverlay.style.transform = "translateX(100%)";
  setTimeout(() => {
    menuOverlay.style.display = "none";
  }, 250);
  menuOpen = false;
}
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!menuOpen) {
    setMenuBtnToClose();
    menuOverlay.style.display = "flex";
    menuOverlay.style.transform = "translateX(0)";
    menuOpen = true;
  } else {
    setMenuBtnToHamburger();
    menuOverlay.style.transform = "translateX(100%)";
    setTimeout(() => {
      menuOverlay.style.display = "none";
    }, 250);
    menuOpen = false;
  }
});

// 오버레이 메뉴 생성
const menuOverlay = document.createElement("div");
menuOverlay.style.position = "fixed";
menuOverlay.style.top = "0";
menuOverlay.style.right = "0";
menuOverlay.style.width = "260px";
menuOverlay.style.height = "100vh";
menuOverlay.style.background = "rgba(255,255,255,0.98)";
menuOverlay.style.boxShadow = "-2px 0 24px #0002";
menuOverlay.style.display = "none";
menuOverlay.style.flexDirection = "column";
menuOverlay.style.alignItems = "flex-start";
menuOverlay.style.padding = "48px 0 0 32px";
menuOverlay.style.zIndex = "3000";
menuOverlay.style.transition = "transform 0.25s cubic-bezier(.4,0,.2,1)";
menuOverlay.style.transform = "translateX(100%)";

const menuList = [
  "Best",
  "Seller",
  "Perfume",
  "Hand&Lip",
  "Body",
  "Hair",
  "Home",
  "Gift Idea",
  "Benefit",
];
menuList.forEach((item) => {
  const btn = document.createElement("button");
  btn.textContent = item;
  btn.style.background = "none";
  btn.style.border = "none";
  btn.style.fontSize = "1.15rem";
  btn.style.fontWeight = "bold";
  btn.style.color = "#222";
  btn.style.margin = "0 0 18px 0";
  btn.style.cursor = "pointer";
  btn.style.letterSpacing = "0.04em";
  btn.style.padding = "0";
  btn.style.textAlign = "left";
  btn.style.width = "100%";
  btn.style.transition = "color 0.15s";
  btn.addEventListener("mouseover", () => (btn.style.color = "#646cff"));
  btn.addEventListener("mouseout", () => (btn.style.color = "#222"));
  menuOverlay.appendChild(btn);
});

document.body.appendChild(menuOverlay);

// SHOP 버튼
const shopBtn = document.createElement("button");
shopBtn.textContent = "SHOP";
shopBtn.style.background = "none";
shopBtn.style.border = "none";
shopBtn.style.color = "#222";
shopBtn.style.fontWeight = "bold";
shopBtn.style.fontSize = "1.1rem";
shopBtn.style.cursor = "pointer";
shopBtn.style.margin = "0 8px";
shopBtn.style.letterSpacing = "0.04em";
shopBtn.style.pointerEvents = "auto";

// ABOUT 버튼
const aboutBtn = document.createElement("button");
aboutBtn.textContent = "ABOUT";
aboutBtn.style.background = "none";
aboutBtn.style.border = "none";
aboutBtn.style.color = "#222";
aboutBtn.style.fontWeight = "bold";
aboutBtn.style.fontSize = "1.1rem";
aboutBtn.style.cursor = "pointer";
aboutBtn.style.margin = "0 8px";
aboutBtn.style.letterSpacing = "0.04em";
aboutBtn.style.pointerEvents = "auto";

rightBox.appendChild(menuBtn);
rightBox.appendChild(shopBtn);
rightBox.appendChild(aboutBtn);

uiBar.appendChild(nfText);
uiBar.appendChild(rightBox);
document.body.appendChild(uiBar);

// FallingText 데모 복구
document.querySelector("#app").innerHTML = `
  <div class="falling-text-container">
    <div id="falling-text-demo" style="width: 100%; height: 400px; max-height: 60vh; position: relative; margin-bottom: 20px;"></div>
  </div>
`;

// FallingText는 이제 initFallingText 함수에서 생성

// 향수병 테두리 위에 아치형 곡선 문구 추가
setTimeout(() => {
  const demo = document.getElementById("falling-text-demo");
  const arch = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arch.setAttribute("width", boxWidth + 40);
  arch.setAttribute("height", 70);
  arch.style.position = "absolute";
  arch.style.left = `${boxX - 20}px`;
  arch.style.top = `${boxY - 70}px`;
  arch.style.pointerEvents = "none";
  arch.style.zIndex = 20;
  arch.innerHTML = `
    <defs>
      <path id="arch-path" d="M 20 70 Q ${(boxWidth + 40) / 2} 0 ${
    boxWidth + 20
  } 70" fill="none" />
    </defs>
    <text font-size="2rem" fill="#222" font-family="'Noto Serif KR', 'Nanum Myeongjo', serif">
      <textPath href="#arch-path" startOffset="50%" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle">
        수많은 기억으로부터 만들어지고 있습니다.
      </textPath>
    </text>
  `;
  demo.appendChild(arch);
}, 200);

// --- Brand Icons ---
function createAndPlaceBrandIcons() {
  const iconContainer = document.createElement("div");
  iconContainer.className = "brand-icons-container";

  const icons = [
    {
      name: "snake",
      svg: '<svg viewBox="0 0 100 100"><path d="M47.5,92.8c-3.8-1-7.5-2.8-10.7-5.3c-10-7.9-14-21.4-9.9-33.1c3.2-9.6,11.6-16.3,21.3-17.5c10.3-1.2,20.1,4.6,24.8,13.6c4.2,8.1,3,17.9-2.8,24.8c-4.6,5.3-11.3,8.3-18.1,8.6c-3.5,0.2-7-0.3-10.3-1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      top: boxY + boxHeight * 0.2,
      left: boxX - 80,
    },
    {
      name: "leaf",
      svg: '<svg viewBox="0 0 100 100"><path d="M50,95C20,80,20,25,50,5c30,20,30,75,0,90z M50,95L50,5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      top: boxY - 70,
      left: boxX + boxWidth - 20,
    },
    {
      name: "waterDrop",
      svg: '<svg viewBox="0 0 100 100"><path d="M50,90 C80,70 80,45 50,15 C20,45 20,70 50,90 Z" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      top: boxY + boxHeight + 20,
      left: boxX + 40,
    },
    {
      name: "book",
      svg: '<svg viewBox="0 0 100 100"><path d="M20 85 V 15 C 20 10, 35 5, 50 15 C 65 5, 80 10, 80 15 V 85 M20 85 C 35 75, 65 75, 80 85 M50 15 V 85" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      top: boxY + boxHeight - 20,
      left: boxX + boxWidth - 10,
    },
  ];

  icons.forEach((icon) => {
    const iconEl = document.createElement("div");
    iconEl.className = `brand-icon brand-icon--${icon.name}`;
    iconEl.innerHTML = icon.svg;
    iconEl.style.top = `${icon.top}px`;
    iconEl.style.left = `${icon.left}px`;
    iconContainer.appendChild(iconEl);
  });

  document.body.appendChild(iconContainer);
}

// Call it after a short delay to ensure other elements are placed
setTimeout(createAndPlaceBrandIcons, 300);

// --- Progress Bar ---
function createProgressBar() {
  const progressContainer = document.getElementById("progress-container");
  if (!progressContainer) return;

  const progressText = document.createElement("div");
  progressText.className = "progress-text";
  progressText.innerHTML = "이야기가 완성 되기 까지 <strong>87%</strong>";

  const progressBarOuter = document.createElement("div");
  progressBarOuter.className = "progress-bar-outer";

  const progressBarInner = document.createElement("div");
  progressBarInner.className = "progress-bar-inner";

  progressBarOuter.appendChild(progressBarInner);
  progressContainer.appendChild(progressText);
  progressContainer.appendChild(progressBarOuter);

  // Trigger the animation after a short delay
  setTimeout(() => {
    progressBarInner.style.width = "87%";
  }, 100);
}

// --- Test Button ---
function createTestButton() {
  const testButton = document.createElement("button");
  testButton.textContent = "테스트 하러 가기";
  testButton.className = "test-button";

  const buttonContainer = document.querySelector(".button-container");
  if (buttonContainer) {
    buttonContainer.appendChild(testButton);
  } else {
    document.body.appendChild(testButton);
  }

  testButton.addEventListener("click", () => {
    window.location.href = "../sidea/index.html";
  });
}

setTimeout(createProgressBar, 300);

// --- Chart.js Donut Chart ---

// 1. 데이터 준비 (임시 데이터)
const wordData = {
  labels: ["고요함", "자유로움", "온기", "섬세함", "새로운 경험", "햇살"],
  datasets: [
    {
      label: "단어 선택 빈도",
      data: [300, 250, 200, 180, 150, 100],
      backgroundColor: [
        "#b6a6e6",
        "#e6c86b",
        "#e6a6c7",
        "#e6a6c7",
        "#6b8be6",
        "#ffe066",
      ],
      borderColor: "#f7f5f2",
      borderWidth: 4,
      hoverBorderWidth: 6,
    },
  ],
};

// 2. 차트 생성 함수
function createDonutChart() {
  const ctx = document.getElementById("word-chart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: wordData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            font: {
              size: 14,
              family: "'Noto Sans KR', sans-serif",
            },
            padding: 20,
          },
        },
        title: {
          display: true,
          text: "가장 사랑받은 기억들",
          font: {
            size: 18,
            weight: "bold",
            family: "'Noto Serif KR', serif",
          },
          padding: {
            top: 10,
            bottom: 30,
          },
        },
      },
      cutout: "60%",
    },
  });
}

// 향수병 위치 업데이트 함수
function updateBottlePosition(values) {
  const { boxX, boxY, boxWidth, boxHeight } =
    values || calculateResponsiveBoxSize();

  // 향수병 요소 찾기
  const basketEl = document.querySelector(".basket-area");
  if (basketEl) {
    // 데모 컨테이너의 크기를 기준으로 계산
    const demoDiv = document.querySelector("#falling-text-demo");
    if (!demoDiv) return;

    const demoRect = demoDiv.getBoundingClientRect();
    const demoWidth = demoRect.width;
    const demoHeight = demoRect.height;

    // 모바일에서도 보이도록 조정된 크기와 위치
    const bottleSize = Math.min(demoWidth * 0.8, demoHeight * 0.8, boxWidth);
    const left = (demoWidth - bottleSize) / 2; // 중앙 정렬
    const top = (demoHeight - bottleSize * 1.2) / 2; // 중앙 정렬, 높이는 1.2배로 해서 병 형태 유지

    basketEl.style.left = `${left}px`;
    basketEl.style.top = `${top}px`;
    basketEl.style.width = `${bottleSize}px`;
    basketEl.style.height = `${bottleSize * 1.2}px`;

    console.log("향수병 위치 업데이트:", {
      left,
      top,
      width: bottleSize,
      height: bottleSize * 1.2,
    });

    console.log("Bottle updated:", {
      bottleSize,
      demoWidth,
      demoHeight,
      left,
      top,
    });
  }

  // 아치형 곡선 문구 위치 업데이트
  const archEl = document.querySelector("svg");
  if (archEl) {
    const demoDiv = document.querySelector("#falling-text-demo");
    const demoWidth = demoDiv.offsetWidth;
    const basketEl = document.querySelector(".basket-area");

    if (basketEl) {
      const basketTop = parseInt(basketEl.style.top, 10);
      const archWidth = Math.min(boxWidth + 40, demoWidth * 0.9);

      archEl.setAttribute("width", archWidth);
      archEl.style.left = `${(demoWidth - archWidth) / 2}px`;
      archEl.style.top = `${basketTop - 70}px`;

      // SVG 내부 패스도 업데이트
      const archPath = archEl.querySelector("#arch-path");
      if (archPath) {
        archPath.setAttribute(
          "d",
          `M 20 70 Q ${archWidth / 2} 0 ${archWidth - 20} 70`
        );
      }
    }
  }
}

// 도넛 차트 및 프로그레스 바 위치 조정
function adjustChartAndProgressPosition() {
  // 반응형 레이아웃으로 변경했으므로 추가 조정은 필요 없음
  // CSS에서 미디어 쿼리로 처리함
}

// 페이지 초기화 함수
function initPage() {
  const demoDiv = document.querySelector("#falling-text-demo");
  const contentContainer = document.querySelector(".main-content");

  // Responsive box size calculation
  const boxSize = calculateResponsiveBoxSize();

  demoDiv.style.width = "100%";
  demoDiv.style.height = "400px";
  demoDiv.style.maxHeight = "60vh";
  demoDiv.style.position = "relative";

  // Create the chart, progress bar, test button, and falling text
  createDonutChart(boxSize);
  createProgressBar();
  createTestButton();
  initFallingText(boxSize);

  // Adjust positions once everything is created
  updateBottlePosition(boxSize);
  adjustChartAndProgressPosition();

  // Ensure we see these components
  console.log("Initialized page components:");
  console.log(
    "- Demo div dimensions:",
    demoDiv.offsetWidth,
    demoDiv.offsetHeight
  );
  console.log("- Box size:", boxSize);

  // Force redraw after a short delay to ensure all elements are positioned correctly
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 100);
}

// 3. DOM이 로드된 후 초기화
document.addEventListener(
  "DOMContentLoaded",
  () => {
    initPage();
  },
  500
); // 약간의 지연 후 초기화
