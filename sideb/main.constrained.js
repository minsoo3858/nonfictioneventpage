// Import required CSS and libraries
// CSS는 HTML에서 직접 로드하므로 여기서는 주석 처리
// import "./style.css";

// 모든 Matter.js 기능을 전역 객체로 가져오기
import * as Matter from "matter-js";

// FallingText 클래스를 IIFE로 감싸서 전역 네임스페이스를 오염시키지 않도록 함
const FallingText = (function () {
  function FallingText(options = {}) {
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
    this.wireframes =
      options.wireframes !== undefined ? options.wireframes : false;
    this.gravity = options.gravity !== undefined ? options.gravity : 0.5;
    this.fontSize = options.fontSize || "1.5rem";
    this.mouseConstraintStiffness =
      options.mouseConstraintStiffness !== undefined
        ? options.mouseConstraintStiffness
        : 0.2;

    // 물리 엔진 변수들
    this.engine = null;
    this.render = null;
    this.runner = null;
    this.canvasEl = null;
    this.animationId = null;
    this.wordBodies = [];
    this.wordElements = [];

    // basket 영역 (선택 사항)
    this.basketArea = options.basketArea;

    // 변경된 부분: 단어들이 떨어질 영역을 명확하게 지정
    this.dropArea = {
      x: this.basketArea ? this.basketArea.x + 10 : 0,
      y: this.basketArea ? this.basketArea.y + 10 : 0,
      width: this.basketArea
        ? this.basketArea.width - 20
        : options.container.clientWidth,
      height: this.basketArea
        ? this.basketArea.height - 20
        : options.container.clientHeight,
    };

    if (this.container) {
      // HTML 생성 및 물리 엔진 초기화
      this.createHTML();
      this.containerEl = this.container.querySelector(
        ".falling-text-container"
      );
      this.canvasEl = this.container.querySelector(".falling-text-canvas");
      this.targetEl = this.container.querySelector(".falling-text-target");
      this.setupText();
      this.storeOriginalPositions();
      this.setupTrigger();

      // 물리 엔진 초기화
      this.initPhysicsEngine();
    }
  }

  // HTML 생성 메소드
  FallingText.prototype.createHTML = function () {
    // 향수병 영역 스타일을 바스켓 영역이 존재할 경우에만 추가
    let basketHTML = "";
    if (this.basketArea) {
      basketHTML = `<div class="basket-area"></div>`;
    }

    this.container.innerHTML = `
      <div class="falling-text-container">
        <div class="falling-text-target"></div>
        <div class="falling-text-canvas"></div>
        ${basketHTML}
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
  };

  // 텍스트 설정 메소드
  FallingText.prototype.setupText = function () {
    // 텍스트를 단어로 나눔
    const words = this.text.split(/\s+/);

    // 타겟 요소에 단어 추가
    words.forEach((word) => {
      const wordEl = document.createElement("span");
      wordEl.textContent = word;

      // 각 단어에 data-word 속성 추가 (CSS에서 색깔 적용용)
      wordEl.setAttribute("data-word", word);

      // 하이라이트 단어인지 확인하여 클래스 추가
      if (this.highlightWords.includes(word)) {
        wordEl.classList.add(this.highlightClass);
      }

      // 기본 스타일
      wordEl.style.margin = "0 10px 10px 0";
      wordEl.style.display = "inline-block";
      wordEl.style.cursor = "pointer";
      wordEl.style.userSelect = "none";

      this.targetEl.appendChild(wordEl);
      this.wordElements.push(wordEl);
    });
  };

  // 원본 위치 저장 메소드
  FallingText.prototype.storeOriginalPositions = function () {
    // 단어별 원본 위치 저장
    this.wordElements.forEach((wordEl) => {
      const rect = wordEl.getBoundingClientRect();
      const containerRect = this.containerEl.getBoundingClientRect();

      wordEl._originalPosition = {
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
      };
    });
  };

  // 트리거 설정 메소드
  FallingText.prototype.setupTrigger = function () {
    // 트리거 타입에 따라 이벤트 리스너 설정
    if (this.trigger === "click" || this.trigger === "auto") {
      this.setupWordClickListeners();
    }

    if (this.trigger === "auto") {
      setTimeout(() => {
        const randomWords = [...this.wordElements].sort(
          () => 0.5 - Math.random()
        );
        const selectedWords = randomWords.slice(
          0,
          Math.min(5, randomWords.length)
        );

        selectedWords.forEach((word, index) => {
          setTimeout(() => this.dropSingleWord(word), index * 300);
        });
      }, 1000);
    }
  };

  // 단어 클릭 이벤트 설정
  FallingText.prototype.setupWordClickListeners = function () {
    this.wordElements.forEach((wordEl) => {
      wordEl.addEventListener("click", () => {
        if (!wordEl._dropped) {
          this.dropSingleWord(wordEl);
        }
      });
    });
  };

  // 단일 단어 드롭 메소드 - 수정됨
  FallingText.prototype.dropSingleWord = function (wordEl) {
    if (wordEl._dropped) return;

    console.log("Dropping word:", wordEl.textContent);
    wordEl._dropped = true;

    // 변경된 부분: 단어가 떨어질 영역 내에서 랜덤한 위치 선택
    const dropAreaWidth = this.dropArea.width;
    const dropAreaHeight = this.dropArea.height * 0.3; // 위쪽 30%에서만 생성

    // 단어 요소의 너비와 높이
    const width = wordEl.offsetWidth || 50; // 기본값 설정
    const height = wordEl.offsetHeight || 20; // 기본값 설정

    // 랜덤한 시작 위치 (향수병 내에서) - 단어 크기를 고려해 경계 안쪽에 배치
    const randomX =
      this.dropArea.x +
      width / 2 +
      Math.random() * Math.max(10, dropAreaWidth - width);
    const randomY =
      this.dropArea.y +
      height / 2 +
      Math.random() * Math.max(10, dropAreaHeight - height);

    console.log("Word position:", { randomX, randomY, width, height });

    // 위치 요소 생성
    const placeholder = document.createElement("span");
    placeholder.style.width = `${width}px`;
    placeholder.style.height = `${height}px`;
    placeholder.style.display = "inline-block";
    placeholder.style.margin = wordEl.style.margin;
    if (wordEl.parentNode) {
      wordEl.parentNode.replaceChild(placeholder, wordEl);
    }

    // 컨테이너에 단어 추가
    this.containerEl.appendChild(wordEl);

    // 단어의 data-word 속성 확인 및 유지
    const wordText = wordEl.getAttribute("data-word") || wordEl.textContent;
    if (!wordEl.getAttribute("data-word")) {
      wordEl.setAttribute("data-word", wordText);
    }

    // Matter.js 물리 엔진에 단어 추가
    const body = Matter.Bodies.rectangle(randomX, randomY, width, height, {
      render: {
        fillStyle: "transparent",
        strokeStyle: "transparent",
        lineWidth: 0,
      },
      restitution: 0.4, // 탄성 증가
      friction: 0.01, // 마찰 조금 증가
      frictionAir: 0.01, // 공기 저항 추가
      density: 0.001, // 밀도 조정
    });

    // 초기 속도 설정
    const initialVelocity = {
      x: (Math.random() - 0.5) * 2, // 좌우 움직임 조금 증가
      y: Math.random() * 0.5, // 아래로 천천히
    };

    Matter.Body.setVelocity(body, initialVelocity);
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05); // 회전 속도 조금 증가

    wordEl.style.position = "absolute";
    wordEl.style.left = `${randomX}px`;
    wordEl.style.top = `${randomY}px`;
    wordEl.style.transform = "translate(-50%, -50%)";
    wordEl.style.zIndex = "10";
    wordEl.style.pointerEvents = "none"; // 마우스 이벤트 방지

    this.wordBodies.push({ elem: wordEl, body, placeholder });

    // 엔진이 준비되어 있는지 확인
    if (this.engine && this.engine.world) {
      Matter.World.add(this.engine.world, [body]);
      console.log("Word added to physics world");
    } else {
      console.error("Physics engine not ready");
    }

    if (!this.animationId) {
      console.log("Starting animation loop");
      this.startUpdateLoop();
    }
  };

  // 물리 엔진 초기화 메소드
  FallingText.prototype.initPhysicsEngine = function () {
    console.log("Initializing physics engine...");

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } =
      Matter;
    const containerRect = this.containerEl.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    console.log("Container dimensions:", { width, height });

    // 기존 엔진이 있다면 정리
    if (this.engine) {
      if (this.runner) Runner.stop(this.runner);
      if (this.render) Render.stop(this.render);
      Engine.clear(this.engine);
    }

    this.engine = Engine.create();
    this.engine.world.gravity.y = this.gravity;
    console.log("Engine created with gravity:", this.gravity);

    this.render = Render.create({
      element: this.canvasEl,
      engine: this.engine,
      options: {
        width,
        height,
        background: this.backgroundColor,
        wireframes: this.wireframes,
        showAngleIndicator: false,
        showVelocity: false,
      },
    });

    if (this.render.canvas) {
      this.render.canvas.style.pointerEvents = "none";
      this.render.canvas.style.zIndex = "-1";
      this.render.canvas.style.position = "absolute";
      this.render.canvas.style.top = "0";
      this.render.canvas.style.left = "0";
    }

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };

    // 변경된 부분: 향수병 영역 내에서만 단어가 움직이도록 경계 설정
    let boundaries = [];

    if (this.basketArea) {
      console.log("Creating basket boundaries for area:", this.basketArea);

      const basketLeft = this.basketArea.x;
      const basketTop = this.basketArea.y;
      const basketRight = this.basketArea.x + this.basketArea.width;
      const basketBottom = this.basketArea.y + this.basketArea.height;

      // 향수병 내부에 벽 생성 - 경계를 병 안쪽으로 조금 더 넣어서 단어가 튀어나오지 않게 함
      const basketFloor = Bodies.rectangle(
        basketLeft + this.basketArea.width / 2,
        basketBottom - 10,
        this.basketArea.width - 30,
        20,
        boundaryOptions
      );

      const basketLeftWall = Bodies.rectangle(
        basketLeft + 15,
        basketTop + this.basketArea.height / 2,
        20,
        this.basketArea.height - 30,
        boundaryOptions
      );

      const basketRightWall = Bodies.rectangle(
        basketRight - 15,
        basketTop + this.basketArea.height / 2,
        20,
        this.basketArea.height - 30,
        boundaryOptions
      );

      const basketCeiling = Bodies.rectangle(
        basketLeft + this.basketArea.width / 2,
        basketTop + 15,
        this.basketArea.width - 30,
        20,
        boundaryOptions
      );

      boundaries = [
        basketFloor,
        basketLeftWall,
        basketRightWall,
        basketCeiling,
      ];
    } else {
      // 화면 경계로 설정
      const floor = Bodies.rectangle(
        width / 2,
        height,
        width,
        10,
        boundaryOptions
      );

      const leftWall = Bodies.rectangle(
        0,
        height / 2,
        10,
        height,
        boundaryOptions
      );

      const rightWall = Bodies.rectangle(
        width,
        height / 2,
        10,
        height,
        boundaryOptions
      );

      const ceiling = Bodies.rectangle(
        width / 2,
        0,
        width,
        10,
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
    Runner.run(this.runner, this.engine);
    Render.run(this.render);

    console.log("Physics engine initialized successfully");
  };

  // 업데이트 루프 시작
  FallingText.prototype.startUpdateLoop = function () {
    // 이미 애니메이션이 실행 중이면 중단
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const updateLoop = () => {
      // 엔진이 없거나 중단된 경우 애니메이션 중지
      if (!this.engine || !this.engine.world) {
        console.log("Engine not available, stopping animation loop");
        return;
      }

      // Matter.js 엔진 업데이트를 먼저 실행
      Matter.Engine.update(this.engine, 16.666); // 60fps

      this.wordBodies.forEach(({ body, elem }) => {
        if (!body || !elem) return;

        const { x, y } = body.position;
        const elemWidth = elem.offsetWidth;
        const elemHeight = elem.offsetHeight;

        // 변경된 부분: 단어가 향수병 영역을 벗어났는지 확인하고 다시 위치 조정
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
            newVelocity.x = -Math.abs(body.velocity.x) * 0.5; // 반대 방향으로 튕기되 속도 감소
            positionChanged = true;
          }

          // 상하 경계 확인 및 반동 적용
          if (y < basketTop) {
            newPosition.y = basketTop;
            newVelocity.y = Math.abs(body.velocity.y) * 0.5; // 아래쪽으로 튕기되 속도 감소
            positionChanged = true;
          } else if (y > basketBottom) {
            newPosition.y = basketBottom;
            newVelocity.y = -Math.abs(body.velocity.y) * 0.5; // 위쪽으로 튕기되 속도 감소
            positionChanged = true;
          }

          // 위치나 속도가 변경되었다면 물리 엔진에 적용
          if (positionChanged) {
            Matter.Body.setPosition(body, newPosition);
            Matter.Body.setVelocity(body, newVelocity);
          }
        }

        // 위치 업데이트 적용 - 보다 안정적인 방식으로
        if (body.position && elem) {
          elem.style.left = `${body.position.x}px`;
          elem.style.top = `${body.position.y}px`;
          elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
        }
      });

      this.animationId = requestAnimationFrame(updateLoop);
    };

    console.log("Starting falling text animation loop");
    updateLoop();
  };

  return FallingText;
})();

// 중앙 박스 크기 지정 - 반응형으로 계산
function calculateResponsiveBoxSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const appElement = document.getElementById("app");
  const appRect = appElement
    ? appElement.getBoundingClientRect()
    : { width: screenWidth, height: screenHeight };

  // 화면 크기에 따라 박스 크기 조절
  let boxWidth, boxHeight, boxX, boxY;

  if (screenWidth < 480) {
    // 모바일
    boxWidth = Math.min(300, screenWidth * 0.85);
    boxHeight = boxWidth * 0.9; // 더 정사각형에 가깝게 변경
    boxX = (screenWidth - boxWidth) / 2;
    boxY = 60; // 더 위로 올림 - 문구와 겹치지 않게
  } else if (screenWidth < 768) {
    // 태블릿
    boxWidth = Math.min(500, screenWidth * 0.7);
    boxHeight = boxWidth * 0.8; // 더 정사각형에 가깝게 변경
    boxX = (screenWidth - boxWidth) / 2;
    boxY = 100; // 태블릿에서도 조금 위로 올림
  } else {
    // 데스크톱 - 이미지와 같이 크기와 위치 조정
    boxWidth = Math.min(520, screenWidth * 0.42); // 병 크기 키움
    boxHeight = boxWidth * 1.2; // 병 높이를 너비의 1.2배로 유지
    boxX = screenWidth * 0.4 - boxWidth / 2; // 더 왼쪽으로 이동
    boxY = 180; // 상단 여백 늘림 (더 아래로 이동)
  }

  return { boxWidth, boxHeight, boxX, boxY };
}

// FallingText 초기화 함수
function initFallingText(boxSize) {
  const { boxX, boxY, boxWidth, boxHeight } =
    boxSize || calculateResponsiveBoxSize();
  const demoDiv = document.querySelector("#falling-text-demo");

  // 기존에 있던 falling-text 요소를 제거하고 재생성
  if (demoDiv) {
    // 기존 인스턴스의 애니메이션 중지 및 물리엔진 제거를 위해 콘텐츠 비우기
    demoDiv.innerHTML = "";

    // 디바이스 크기에 따라 글자 크기 조정
    const screenWidth = window.innerWidth;
    let fontSize = "2rem"; // 데스크톱 크기 키움

    if (screenWidth < 480) {
      fontSize = "1.2rem"; // 모바일
    } else if (screenWidth < 768) {
      fontSize = "1.5rem"; // 태블릿
    }

    // 떨어지는 단어 개수 조정 (모바일에서는 더 적게)
    const words =
      screenWidth < 480
        ? "고요함 섬세함 자유로움 대화 진심 온기"
        : "고요함 섬세함 자유로움 새로운 경험 감정 조용한 시간 대화 솔직함 햇살 진심 온기 Gentle Night For rest Forget Me Not Santal Cream";

    // 모바일에서는 중력을 더 낮게 설정하여 천천히 떨어지게 함
    const gravity = screenWidth < 480 ? 0.2 : 0.3;

    // 향수병 영역 계산 (모바일에서도 잘 보이게)
    // 데모 컨테이너의 크기를 기준으로 계산
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
        "섬세함",
        "온기",
        "GentleNight",
        "SantalCream",
      ],
      highlightClass: "highlighted",
      trigger: "auto", // 자동으로 단어가 떨어지게 함
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

    // 페이지 로드 시 자동으로 모든 단어를 병 안에 넣어주는 코드
    // 약간의 시간차를 두고 단어들을 떨어뜨림
    setTimeout(() => {
      if (fallingTextInstance && fallingTextInstance.wordElements) {
        fallingTextInstance.wordElements.forEach((word, index) => {
          setTimeout(() => {
            if (!word._dropped && fallingTextInstance.dropSingleWord) {
              fallingTextInstance.dropSingleWord(word);
            }
          }, index * 100); // 단어마다 100ms 간격으로 떨어뜨림
        });
      }
    }, 500); // 페이지 로드 후 0.5초 후에 시작

    console.log("Initialized FallingText with bottle dimensions:", {
      x: bottleX,
      y: bottleY,
      width: bottleSize,
      height: bottleSize * 1.2,
    });
  }
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

    // 화면 크기에 따른 조정
    const screenWidth = window.innerWidth;
    let bottleSize, left, top;

    if (screenWidth >= 769) {
      // 데스크톱 - 테두리를 더 왼쪽과 아래로 이동
      bottleSize = Math.min(demoWidth * 0.9, demoHeight * 0.95, boxWidth); // 크기 유지
      left = demoWidth * 0.05; // 더 왼쪽으로 배치
      top = demoHeight * 0.15; // 더 아래로 배치
    } else {
      // 모바일/태블릿에서는 중앙 정렬
      bottleSize = Math.min(demoWidth * 0.8, demoHeight * 0.8, boxWidth);
      left = (demoWidth - bottleSize) / 2;
      top = (demoHeight - bottleSize * 1.2) / 2;
    }

    // 항상 병의 높이는 너비의 1.2배로 유지
    basketEl.style.left = `${left}px`;
    basketEl.style.top = `${top}px`;
    basketEl.style.width = `${bottleSize}px`;
    basketEl.style.height = `${bottleSize * 1.2}px`;

    console.log("Updated bottle position:", {
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

// FallingText 데모 복구
function setupFallingTextDemo() {
  const appElement = document.querySelector("#app");
  if (appElement) {
    // 화면 크기에 따라 컨테이너 높이 조정
    const screenWidth = window.innerWidth;
    let demoHeight = "400px";

    if (screenWidth < 480) {
      demoHeight = "260px"; // 모바일 - 높이 더 줄여서 문구와 겹치지 않게
    } else if (screenWidth < 768) {
      demoHeight = "320px"; // 태블릿 - 높이 줄임
    } else {
      demoHeight = "500px"; // 데스크톱에서는 더 큰 높이로 설정
    }

    appElement.innerHTML = `
      <div class="falling-text-container">
        <div id="falling-text-demo" style="width: 100%; height: ${demoHeight}; position: relative; margin-bottom: 20px; overflow: visible;"></div>
      </div>
    `;

    console.log("Set up falling text demo with height:", demoHeight);
  }
}

// 배경색 변경
function setupBodyStyles() {
  document.body.style.background = "#f7f5f2";
  document.body.style.margin = "0";

  // 화면 크기에 따라 overflow 설정
  const screenWidth = window.innerWidth;

  if (screenWidth < 768) {
    // 모바일/태블릿에서는 스크롤 허용
    document.body.style.overflow = "auto";
    document.body.style.overflowX = "hidden"; // 가로 스크롤만 차단
    document.body.style.height = "auto";
    document.body.style.minHeight = "100vh";
  } else {
    // 데스크톱에서는 기존 설정
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    document.body.style.minHeight = "100vh";
  }

  // 모바일에서 헤더와 문구 위치 강제 적용
  if (screenWidth <= 480) {
    const nfHeader = document.querySelector(".nf-header");
    const nfQuestion = document.querySelector(".nf-question");

    if (nfHeader) {
      nfHeader.style.padding = "-20px 24px 0 24px";
    }

    if (nfQuestion) {
      nfQuestion.style.top = "-60px";
    }
  }
}

// 좌측 상단 NONFICTION, 우측 상단 햄버거/SHOP/ABOUT
function createUIBar() {
  // UI 바는 HTML에서 이미 정의되어 있으므로 생성하지 않음
  // 첨부한 사진처럼 보이려면 JS로 생성하는 것보다 HTML에서 정의된 것을 사용하는 것이 좋음
  return;

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

  // 햄버거 아이콘 생성
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

  // 닫기 아이콘 생성
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

  // 메뉴 버튼 상태 설정 함수들
  function setMenuBtnToHamburger() {
    menuBtn.innerHTML = "";
    menuBtn.appendChild(createHamburgerIcon());
  }

  function setMenuBtnToClose() {
    menuBtn.innerHTML = "";
    menuBtn.appendChild(createCloseIcon());
  }

  setMenuBtnToHamburger();

  // 메뉴 열기/닫기 함수들
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
      openMenu();
    } else {
      setMenuBtnToHamburger();
      closeMenu();
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
}

// 향수병 테두리 위에 아치형 곡선 문구는 HTML에서 관리
function createArchedText(boxSize) {
  // HTML의 nf-question 클래스가 이미 이 역할을 함
  return;
}

// 브랜드 아이콘 생성 및 배치
function createAndPlaceBrandIcons(boxSize) {
  const { boxX, boxY, boxWidth, boxHeight } =
    boxSize || calculateResponsiveBoxSize();

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

// 프로그레스 바 생성
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

  // 데스크톱 레이아웃에서 프로그레스 바 스타일 추가 조정
  const screenWidth = window.innerWidth;
  if (screenWidth >= 769) {
    progressContainer.style.marginTop = "40px";
    progressText.style.fontSize = "1.2rem";
  }
}

// 테스트 버튼 생성
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
    window.location.href = "/sidea/index.html";
  });
}

// 도넛 차트 데이터
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

// Chart.js 도넛 차트 생성 함수
function createDonutChart() {
  const ctx = document.getElementById("word-chart");
  if (!ctx) return;

  // 데스크탑 레이아웃에서 차트 컨테이너 스타일 조정
  const screenWidth = window.innerWidth;
  const chartContainer = document.querySelector(".chart-container");

  if (screenWidth >= 769 && chartContainer) {
    chartContainer.style.padding = "30px 20px";
    chartContainer.style.boxShadow = "0 6px 24px rgba(0, 0, 0, 0.08)";
  }

  const chartContext = ctx.getContext("2d");
  new Chart(chartContext, {
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
              size: screenWidth >= 769 ? 16 : 14,
              family: "'Noto Sans KR', sans-serif",
            },
            padding: screenWidth >= 769 ? 25 : 20,
            boxWidth: screenWidth >= 769 ? 20 : 15,
          },
        },
        title: {
          display: true,
          text: "가장 사랑받은 기억들",
          font: {
            size: screenWidth >= 769 ? 22 : 18,
            weight: "bold",
            family: "'Noto Serif KR', serif",
          },
          padding: {
            top: screenWidth >= 769 ? 15 : 10,
            bottom: screenWidth >= 769 ? 40 : 30,
          },
        },
      },
      cutout: "60%",
    },
  });
}

// 윈도우 크기 변경 시 요소 위치 재계산
window.addEventListener("resize", () => {
  // 일정 간격으로 debounce 된 resize 이벤트만 처리
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    console.log("Window resized, reinitializing components...");

    // body 스타일 다시 설정 (모바일/데스크톱에 따라)
    setupBodyStyles();

    // FallingText 데모 컨테이너 높이 조정
    const screenWidth = window.innerWidth;
    const demoDiv = document.querySelector("#falling-text-demo");

    // 모바일에서 헤더와 문구 위치 강제 적용 (리사이즈 시에도)
    if (screenWidth <= 480) {
      const nfHeader = document.querySelector(".nf-header");
      const nfQuestion = document.querySelector(".nf-question");

      if (nfHeader) {
        nfHeader.style.padding = "-20px 24px 0 24px";
      }

      if (nfQuestion) {
        nfQuestion.style.top = "-60px";
      }
    }

    if (demoDiv) {
      if (screenWidth < 480) {
        demoDiv.style.height = "260px"; // 모바일 - 높이 더 줄임
      } else if (screenWidth < 768) {
        demoDiv.style.height = "320px"; // 태블릿 - 높이 줄임
      } else {
        demoDiv.style.height = "500px"; // 데스크탑 - 높이를 늘려서 더 크게 보이게
      }
    }

    const newValues = calculateResponsiveBoxSize();

    // 전체 요소 재초기화
    setupFallingTextDemo();
    initFallingText(newValues);

    // 향수병 위치 업데이트
    updateBottlePosition(newValues);

    // 도넛 차트와 프로그레스 바 위치 조정
    adjustChartAndProgressPosition();

    console.log("Components reinitialized after resize");
  }, 350); // 더 긴 디바운스 시간으로 성능 향상
});

// 페이지 초기화 함수
function initPage() {
  const demoDiv = document.querySelector("#falling-text-demo");
  const contentContainer = document.querySelector(".main-content");

  // Responsive box size calculation
  const boxSize = calculateResponsiveBoxSize();

  if (demoDiv) {
    demoDiv.style.width = "100%";
    demoDiv.style.height = "400px";
    demoDiv.style.maxHeight = "60vh";
    demoDiv.style.position = "relative";
  }

  // Create the chart, progress bar, test button, and falling text
  createDonutChart();
  createProgressBar();
  createTestButton();
  initFallingText(boxSize);

  // Adjust positions once everything is created
  updateBottlePosition(boxSize);
  adjustChartAndProgressPosition();

  // Create brand icons only (arched text is in HTML)
  createAndPlaceBrandIcons(boxSize);

  // Ensure we see these components
  console.log("Initialized page components:");
  console.log(
    "- Demo div dimensions:",
    demoDiv ? demoDiv.offsetWidth : "not found",
    demoDiv ? demoDiv.offsetHeight : "not found"
  );
  console.log("- Box size:", boxSize);

  // Force redraw after a short delay to ensure all elements are positioned correctly
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 100);
}

// 메인 실행 코드 - DOM이 로드된 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  setupBodyStyles();
  createUIBar();
  setupFallingTextDemo();

  // NONFICTION 로고 클릭 시 새로고침 기능 추가
  const logoElem = document.querySelector(".nf-logo");
  if (logoElem) {
    logoElem.style.cursor = "pointer";
    logoElem.addEventListener("click", (e) => {
      e.preventDefault(); // 링크 기본 동작 방지
      window.location.reload();
    });
  }

  // 초기화 함수를 약간 지연 후 호출하여 모든 DOM 요소가 준비되도록 함
  setTimeout(() => {
    initPage();
  }, 100);
});
