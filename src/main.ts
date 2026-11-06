import { Chess3DBoard } from './board';
import { ChessGameController, GameMode } from './game';
import { soundManager } from './audio';
import { AIDifficulty } from './ai';
import { networkManager } from './network';
import { ICONS, getPieceSvg } from './icons';
import type { SceneTheme } from './environment';
import type { Square } from 'chess.js';

function showToast(message: string, duration: number = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container') as HTMLElement;
  if (!container) return;

  // 1. Initialize 3D Board and Game Controller
  const board3D = new Chess3DBoard(container);
  const controller = new ChessGameController(board3D);

  // 2. DOM Elements
  const turnBadge = document.getElementById('turn-badge')!;
  const turnText = document.getElementById('turn-text')!;
  const checkAlert = document.getElementById('check-alert')!;
  const btnSound = document.getElementById('btn-sound')!;
  const soundIcon = document.getElementById('sound-icon')!;
  const btnRules = document.getElementById('btn-rules')!;
  const helpDialog = document.getElementById('help-dialog') as HTMLDialogElement;

  const gamePanel = document.getElementById('game-panel')!;
  const panelToggleBtn = document.getElementById('panel-toggle-btn')!;

  const modePve = document.getElementById('mode-pve')!;
  const modePvp = document.getElementById('mode-pvp')!;
  const modeOnline = document.getElementById('mode-online')!;
  const aiOptionsBox = document.getElementById('ai-options-box')!;
  const onlineOptionsBox = document.getElementById('online-options-box')!;

  const colorWhite = document.getElementById('color-white')!;
  const colorBlack = document.getElementById('color-black')!;
  const diffButtons = document.querySelectorAll<HTMLButtonElement>('.diff-btn');

  const sceneButtons = document.querySelectorAll<HTMLButtonElement>('.scene-btn');
  const camButtons = document.querySelectorAll<HTMLButtonElement>('.cam-btn');
  const autoCamToggle = document.getElementById('auto-camera-toggle') as HTMLInputElement;

  const whiteCapturedList = document.getElementById('white-captured-list')!;
  const blackCapturedList = document.getElementById('black-captured-list')!;
  const whiteAdvantage = document.getElementById('white-advantage')!;
  const blackAdvantage = document.getElementById('black-advantage')!;

  const historyTbody = document.getElementById('history-tbody')!;
  const historyScroll = document.getElementById('history-scroll')!;

  const btnUndo = document.getElementById('btn-undo')!;
  const btnRestart = document.getElementById('btn-restart')!;

  const promoDialog = document.getElementById('promotion-dialog') as HTMLDialogElement;
  const promoButtons = document.querySelectorAll<HTMLButtonElement>('.promo-btn');
  const gameOverDialog = document.getElementById('game-over-dialog') as HTMLDialogElement;
  const gameOverTitle = document.getElementById('gameover-title')!;
  const gameOverDesc = document.getElementById('gameover-desc')!;
  const gameOverIcon = document.getElementById('gameover-icon')!;
  const btnPlayAgain = document.getElementById('btn-play-again')!;
  const btnReviewBoard = document.getElementById('btn-review-board')!;

  // Online Multiplayer Elements
  const onlineLobbyPanel = document.getElementById('online-lobby-panel')!;
  const onlineRoomPanel = document.getElementById('online-room-panel')!;
  const hostColorWhite = document.getElementById('host-color-white')!;
  const hostColorBlack = document.getElementById('host-color-black')!;
  const hostColorRandom = document.getElementById('host-color-random')!;
  const btnCreateRoom = document.getElementById('btn-create-room')!;
  const inputRoomCode = document.getElementById('input-room-code') as HTMLInputElement;
  const btnJoinRoom = document.getElementById('btn-join-room')!;

  const roomCodeText = document.getElementById('room-code-text')!;
  const btnCopyLink = document.getElementById('btn-copy-link')!;
  const selfRoleText = document.getElementById('self-role-text')!;
  const opponentStatusDot = document.getElementById('opponent-status-dot')!;
  const opponentStatusText = document.getElementById('opponent-status-text')!;

  const btnQuickChat = document.getElementById('btn-quick-chat')!;
  const quickChatMenu = document.getElementById('quick-chat-menu')!;
  const chatItems = document.querySelectorAll<HTMLButtonElement>('.chat-item');
  const btnOfferDraw = document.getElementById('btn-offer-draw')!;
  const btnOnlineResign = document.getElementById('btn-online-resign')!;
  const btnLeaveRoom = document.getElementById('btn-leave-room')!;

  // Prompt Dialog for Online Actions
  const onlinePromptDialog = document.getElementById('online-prompt-dialog') as HTMLDialogElement;
  const promptIcon = document.getElementById('prompt-icon')!;
  const promptTitle = document.getElementById('prompt-title')!;
  const promptDesc = document.getElementById('prompt-desc')!;
  const btnPromptAccept = document.getElementById('btn-prompt-accept')!;
  const btnPromptDecline = document.getElementById('btn-prompt-decline')!;

  // Inject Static SVG Icons
  document.getElementById('logo-icon-svg')!.innerHTML = ICONS.crown;
  soundIcon.innerHTML = ICONS.volume;
  document.getElementById('help-icon-svg')!.innerHTML = ICONS.help;
  document.getElementById('panel-toggle-icon')!.innerHTML = ICONS.chevronLeft;

  document.getElementById('icon-mode-pve')!.innerHTML = ICONS.bot;
  document.getElementById('icon-mode-pvp')!.innerHTML = ICONS.users;
  document.getElementById('icon-mode-online')!.innerHTML = ICONS.globe;

  document.getElementById('icon-color-white')!.innerHTML = getPieceSvg('k', 'w');
  document.getElementById('icon-color-black')!.innerHTML = getPieceSvg('k', 'b');
  document.getElementById('icon-host-white')!.innerHTML = getPieceSvg('k', 'w');
  document.getElementById('icon-host-black')!.innerHTML = getPieceSvg('k', 'b');
  document.getElementById('icon-host-random')!.innerHTML = ICONS.dice;

  document.getElementById('icon-create-room')!.innerHTML = ICONS.sparkles;
  document.getElementById('icon-copy-link')!.innerHTML = ICONS.copy;
  document.getElementById('icon-chat')!.innerHTML = ICONS.chat;
  document.getElementById('icon-draw')!.innerHTML = ICONS.handshake;
  document.getElementById('icon-resign')!.innerHTML = ICONS.flag;
  document.getElementById('icon-leave')!.innerHTML = ICONS.logout;

  document.getElementById('icon-undo-svg')!.innerHTML = ICONS.undo;
  document.getElementById('icon-restart-svg')!.innerHTML = ICONS.restart;

  // Scene switcher SVG icons
  const iconSceneRoyal = document.getElementById('icon-scene-royal');
  if (iconSceneRoyal) iconSceneRoyal.innerHTML = ICONS.crown;
  const iconScenePenthouse = document.getElementById('icon-scene-penthouse');
  if (iconScenePenthouse) iconScenePenthouse.innerHTML = ICONS.building;
  const iconSceneStudy = document.getElementById('icon-scene-study');
  if (iconSceneStudy) iconSceneStudy.innerHTML = ICONS.book;
  const iconSceneTournament = document.getElementById('icon-scene-tournament');
  if (iconSceneTournament) iconSceneTournament.innerHTML = ICONS.shield;

  let currentPromptAction: { onAccept: () => void; onDecline: () => void } | null = null;

  function showOnlinePrompt(iconSvg: string, title: string, desc: string, onAccept: () => void, onDecline: () => void) {
    promptIcon.innerHTML = iconSvg;
    promptTitle.textContent = title;
    promptDesc.textContent = desc;
    currentPromptAction = { onAccept, onDecline };
    onlinePromptDialog.showModal();
  }

  btnPromptAccept.addEventListener('click', () => {
    onlinePromptDialog.close();
    if (currentPromptAction) currentPromptAction.onAccept();
    currentPromptAction = null;
  });

  btnPromptDecline.addEventListener('click', () => {
    onlinePromptDialog.close();
    if (currentPromptAction) currentPromptAction.onDecline();
    currentPromptAction = null;
  });

  // 3. UI State Update Function
  function updateUI() {
    const isWhiteTurn = controller.chess.turn() === 'w';

    // Turn badge
    turnBadge.className = `turn-badge ${isWhiteTurn ? 'white-turn' : 'black-turn'}`;
    if (controller.isAiThinking) {
      turnText.textContent = 'AI 思考中...';
    } else if (controller.mode === 'online') {
      const isMyTurn = controller.chess.turn() === controller.playerColor;
      turnText.textContent = isWhiteTurn ? `白方回合 ${isMyTurn ? '(你)' : '(对手)'}` : `黑方回合 ${isMyTurn ? '(你)' : '(对手)'}`;
    } else {
      turnText.textContent = isWhiteTurn ? '白方回合' : '黑方回合';
    }

    // Check alert
    if (controller.chess.inCheck() && !controller.chess.isGameOver()) {
      checkAlert.classList.remove('hidden');
    } else {
      checkAlert.classList.add('hidden');
    }

    // Captured pieces & Material difference (Rendered via clean SVG)
    const { whiteCaptured, blackCaptured, diff } = controller.getCapturedPieces();

    whiteCapturedList.innerHTML = whiteCaptured
      .map((p) => `<span class="captured-item">${getPieceSvg(p, 'b')}</span>`)
      .join('');
    blackCapturedList.innerHTML = blackCaptured
      .map((p) => `<span class="captured-item">${getPieceSvg(p, 'w')}</span>`)
      .join('');

    if (diff > 0) {
      whiteAdvantage.textContent = `+${diff}`;
      blackAdvantage.textContent = '';
    } else if (diff < 0) {
      whiteAdvantage.textContent = '';
      blackAdvantage.textContent = `+${Math.abs(diff)}`;
    } else {
      whiteAdvantage.textContent = '';
      blackAdvantage.textContent = '';
    }

    // Move History Table
    let tableRows = '';
    for (let i = 0; i < controller.history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = controller.history[i]?.san || '';
      const blackMove = controller.history[i + 1]?.san || '';
      tableRows += `
        <tr>
          <td>${moveNum}.</td>
          <td>${whiteMove}</td>
          <td>${blackMove}</td>
        </tr>
      `;
    }
    historyTbody.innerHTML = tableRows;
    historyScroll.scrollTop = historyScroll.scrollHeight;

    // In online mode, hide undo and restart from panel actions
    if (controller.mode === 'online') {
      btnUndo.style.display = 'none';
      btnRestart.style.display = 'none';
    } else {
      btnUndo.style.display = 'flex';
      btnRestart.style.display = 'flex';
    }
  }

  // 4. Hook Controller Callbacks
  controller.onStateChange = updateUI;

  // Pawn Promotion Handler with Crisp SVG Piece Silhouettes
  let promoCallback: ((piece: 'q' | 'r' | 'b' | 'n') => void) | null = null;
  controller.onPromotionNeeded = (color, onSelect) => {
    promoCallback = onSelect;
    const pieces: ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n'];
    pieces.forEach((p) => {
      const el = document.getElementById(`promo-${p}`);
      if (el) el.innerHTML = getPieceSvg(p, color);
    });
    promoDialog.showModal();
  };

  promoButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const piece = btn.dataset.piece as 'q' | 'r' | 'b' | 'n';
      promoDialog.close();
      if (promoCallback) {
        promoCallback(piece);
        promoCallback = null;
      }
    });
  });

  // Game Over Handler
  controller.onGameOver = ({ winner, reason }) => {
    if (winner === 'w' || winner === 'b') {
      gameOverIcon.innerHTML = ICONS.trophy;
      gameOverTitle.textContent = winner === 'w' ? '白方胜出！' : '黑方胜出！';
    } else {
      gameOverIcon.innerHTML = ICONS.handshake;
      gameOverTitle.textContent = '平局！';
    }
    gameOverDesc.textContent = reason;
    gameOverDialog.showModal();
  };

  btnPlayAgain.addEventListener('click', () => {
    gameOverDialog.close();
    if (controller.mode === 'online') {
      networkManager.requestRematch();
      showToast('已向对手发送再战申请...');
    } else {
      controller.resetGame();
    }
  });

  btnReviewBoard.addEventListener('click', () => {
    gameOverDialog.close();
  });

  // 5. Panel & Controls Interaction
  panelToggleBtn.addEventListener('click', () => {
    gamePanel.classList.toggle('collapsed');
  });

  // Sound toggle
  btnSound.addEventListener('click', () => {
    soundManager.enabled = !soundManager.enabled;
    soundIcon.innerHTML = soundManager.enabled ? ICONS.volume : ICONS.volumeMute;
  });

  // Rules dialog
  btnRules.addEventListener('click', () => {
    helpDialog.showModal();
  });

  // Mode Selection
  function selectMode(mode: GameMode) {
    [modePve, modePvp, modeOnline].forEach((b) => b.classList.remove('active'));
    aiOptionsBox.style.display = 'none';
    onlineOptionsBox.classList.add('hidden');

    if (mode === 'pve') {
      modePve.classList.add('active');
      aiOptionsBox.style.display = 'flex';
      controller.setGameMode('pve', colorWhite.classList.contains('active') ? 'w' : 'b');
    } else if (mode === 'pvp') {
      modePvp.classList.add('active');
      controller.setGameMode('pvp');
    } else if (mode === 'online') {
      modeOnline.classList.add('active');
      onlineOptionsBox.classList.remove('hidden');
      networkManager.connect();
    }
  }

  modePve.addEventListener('click', () => selectMode('pve'));
  modePvp.addEventListener('click', () => selectMode('pvp'));
  modeOnline.addEventListener('click', () => selectMode('online'));

  // Player Color Selection (PvE)
  colorWhite.addEventListener('click', () => {
    colorWhite.classList.add('active');
    colorBlack.classList.remove('active');
    controller.setGameMode('pve', 'w');
  });

  colorBlack.addEventListener('click', () => {
    colorBlack.classList.add('active');
    colorWhite.classList.remove('active');
    controller.setGameMode('pve', 'b');
  });

  // AI Difficulty
  diffButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      diffButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const diff = btn.dataset.diff as AIDifficulty;
      controller.setDifficulty(diff);
    });
  });

  // Scene Theme Switcher
  sceneButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      sceneButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const scene = btn.dataset.scene as SceneTheme;
      board3D.setSceneTheme(scene);
      const sceneName = btn.querySelector('span:last-child')?.textContent || scene;
      showToast(`已切换至「${sceneName}」场景`);
    });
  });

  // Camera Presets
  camButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      camButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view as 'white' | 'black' | 'top' | 'side' | 'isometric';
      board3D.setCameraView(view);
    });
  });

  // Auto camera rotation toggle
  autoCamToggle.addEventListener('change', () => {
    controller.autoRotateCamera = autoCamToggle.checked;
  });

  // Action Buttons
  btnUndo.addEventListener('click', () => {
    controller.undoMove();
  });

  btnRestart.addEventListener('click', () => {
    if (confirm('确定要重新开始当前对局吗？')) {
      controller.resetGame();
    }
  });

  // =========================================================================
  // 6. Online Multiplayer Logic
  // =========================================================================
  let hostColorChoice: 'w' | 'b' | 'random' = 'w';
  [hostColorWhite, hostColorBlack, hostColorRandom].forEach((btn) => {
    btn.addEventListener('click', () => {
      [hostColorWhite, hostColorBlack, hostColorRandom].forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn === hostColorWhite) hostColorChoice = 'w';
      else if (btn === hostColorBlack) hostColorChoice = 'b';
      else hostColorChoice = 'random';
    });
  });

  // Create Room
  btnCreateRoom.addEventListener('click', async () => {
    btnCreateRoom.querySelector('span:last-child')!.textContent = '正在创建...';
    const roomId = await networkManager.createRoom(hostColorChoice);
    btnCreateRoom.querySelector('span:last-child')!.textContent = '生成 6 位房间号';

    if (roomId) {
      enterOnlineRoom(roomId, networkManager.myColor as 'w' | 'b', true);
      showToast(`房间创建成功，房间号: <strong>${roomId}</strong>`);
    } else {
      showToast('创建房间失败，请确认网络连接');
    }
  });

  // Restrict room code input to digits only
  inputRoomCode.addEventListener('input', () => {
    inputRoomCode.value = inputRoomCode.value.replace(/\D/g, '');
  });

  // Join Room
  btnJoinRoom.addEventListener('click', async () => {
    const code = inputRoomCode.value.trim().replace(/\D/g, '');
    if (!code || code.length !== 6) {
      showToast('请输入完整的 6 位数字房间号');
      return;
    }
    btnJoinRoom.textContent = '加入中...';
    const success = await networkManager.joinRoom(code);
    btnJoinRoom.textContent = '加入对战';

    if (success) {
      enterOnlineRoom(code, networkManager.myColor as 'w' | 'b', false);
      showToast(`成功加入房间: <strong>${code}</strong>`);
    }
  });

  function enterOnlineRoom(roomId: string, color: 'w' | 'b', isHost: boolean) {
    onlineLobbyPanel.classList.add('hidden');
    onlineRoomPanel.classList.remove('hidden');

    roomCodeText.textContent = roomId;
    selfRoleText.textContent = color === 'w' ? '你执白' : '你执黑';

    if (isHost) {
      opponentStatusDot.className = 'status-dot waiting';
      opponentStatusText.textContent = '等待对手加入...';
    } else {
      opponentStatusDot.className = 'status-dot online';
      opponentStatusText.textContent = '对手已在线';
    }

    controller.setGameMode('online', color);
  }

  // Copy Link
  btnCopyLink.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCodeText.textContent}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('邀请链接已复制到剪贴板，发给好友即可对战！');
    } catch {
      prompt('请复制此链接发送给好友：', url);
    }
  });

  // Quick Chat
  btnQuickChat.addEventListener('click', () => {
    quickChatMenu.classList.toggle('hidden');
  });

  chatItems.forEach((item) => {
    item.addEventListener('click', () => {
      const text = item.dataset.text || '';
      networkManager.sendChat(text);
      quickChatMenu.classList.add('hidden');
    });
  });

  // Draw & Resign
  btnOfferDraw.addEventListener('click', () => {
    if (confirm('确定要向对手提议和棋吗？')) {
      networkManager.offerDraw();
      showToast('已向对手发送和棋请求');
    }
  });

  btnOnlineResign.addEventListener('click', () => {
    if (confirm('确定要认输吗？')) {
      networkManager.resign();
    }
  });

  // Leave Room
  btnLeaveRoom.addEventListener('click', () => {
    if (confirm('确定要离开当前房间吗？')) {
      networkManager.leaveRoom();
      onlineRoomPanel.classList.add('hidden');
      onlineLobbyPanel.classList.remove('hidden');
      controller.setGameMode('pve', 'w');
      selectMode('pve');
      showToast('已退出房间');
    }
  });

  // =========================================================================
  // 7. Network Event Subscriptions
  // =========================================================================
  networkManager.on('player_joined', (data) => {
    opponentStatusDot.className = 'status-dot online';
    opponentStatusText.textContent = `对手 (${data.opponentName}) 已加入`;
    soundManager.playSelect();
    showToast(`对手 <strong>${data.opponentName}</strong> 已加入对战！`);
  });

  networkManager.on('opponent_move', (data) => {
    controller.executeMove(data.from as Square, data.to as Square, data.promotion, true);
  });

  networkManager.on('chat', (data) => {
    soundManager.playSelect();
    const tag = data.isSelf ? '我' : data.sender;
    showToast(`<strong>${tag}</strong>: ${data.text}`);
  });

  networkManager.on('draw_offered', () => {
    soundManager.playCheck();
    showOnlinePrompt(
      ICONS.handshake,
      '和棋提议',
      '对手向您提议和棋，是否同意？',
      () => {
        networkManager.acceptDraw();
      },
      () => {
        showToast('您拒绝了和棋提议');
      }
    );
  });

  networkManager.on('draw_agreed', () => {
    gameOverIcon.innerHTML = ICONS.handshake;
    gameOverTitle.textContent = '双方议和！';
    gameOverDesc.textContent = '双方达成和棋共识';
    gameOverDialog.showModal();
  });

  networkManager.on('player_resigned', (data) => {
    const isSelfWin = data.winner === controller.playerColor;
    gameOverIcon.innerHTML = isSelfWin ? ICONS.trophy : ICONS.flag;
    gameOverTitle.textContent = isSelfWin ? '你获得了胜利！' : '对局结束';
    gameOverDesc.textContent = isSelfWin ? '对手认输，白方获胜' : '你认输了，黑方获胜';
    gameOverDialog.showModal();
  });

  networkManager.on('rematch_requested', () => {
    soundManager.playCheck();
    showOnlinePrompt(
      ICONS.restart,
      '再战申请',
      '对手申请再来一局，是否接受？',
      () => {
        networkManager.acceptRematch();
      },
      () => {
        showToast('已谢绝再战申请');
      }
    );
  });

  networkManager.on('game_reset', (data) => {
    controller.playerColor = data.color;
    controller.resetGame();
    selfRoleText.textContent = data.color === 'w' ? '你执白' : '你执黑';
    showToast(`新对局开始！你执${data.color === 'w' ? '白' : '黑'}`);
  });

  networkManager.on('opponent_left', (data) => {
    opponentStatusDot.className = 'status-dot offline';
    opponentStatusText.textContent = '对手已离开';
    showToast(`对手 <strong>${data.name}</strong> 已离开房间`);
  });

  // 8. Auto-Join if URL has ?room=...
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    selectMode('online');
    inputRoomCode.value = roomParam.replace(/\D/g, '');
    setTimeout(() => {
      btnJoinRoom.click();
    }, 600);
  }

  // Initial UI Render
  updateUI();
});
