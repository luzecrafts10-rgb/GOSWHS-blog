/* ── SWHS BLOG APP ── */
'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ADMIN_KEY = 'sw.admin.26';
const STORAGE = {
  users:   'swhs_users',
  posts:   'swhs_posts',
  session: 'swhs_session',
  reports: 'swhs_reports',
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
  currentUser: null,
  currentPost: null,
  prevPage: 'home',
  pendingCode: null,
  pendingUser: null,
  pendingPhone: null,
  pendingAction: null,
  tags: [],
  activeTagFilter: null,
};

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const load  = key => JSON.parse(localStorage.getItem(key) || '[]');
const loadObj = key => JSON.parse(localStorage.getItem(key) || 'null');
const save  = (key, val) => localStorage.setItem(key, JSON.stringify(val));

function getPosts()   { return load(STORAGE.posts); }
function getUsers()   { return load(STORAGE.users); }
function getReports() { return load(STORAGE.reports); }
function savePosts(p)   { save(STORAGE.posts, p); }
function saveUsers(u)   { save(STORAGE.users, u); }
function saveReports(r) { save(STORAGE.reports, r); }

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  renderNav();
  showPage('home');
  renderHome();
  setupTagInput();
  seedDemoData();
});

function seedDemoData() {
  if (getPosts().length > 0) return;
  const demo = [
    {
      id: uid(), title: 'SW고 입학 후 첫 소감 🎉',
      content: '드디어 경기오산 소프트웨어고등학교에 입학했습니다!\n처음에는 걱정도 많았지만, 선생님들과 친구들 덕분에 빠르게 적응하고 있어요.\n\n특히 코딩 수업이 너무 재밌었고, 앞으로 많은 것을 배울 수 있을 것 같아 기대됩니다.\n\n모두 열심히 합시다! 💪',
      author: '이소연', authorRole: 'student', authorGrade: '1-1',
      tags: ['입학', '후기', '1학년'], likes: ['user2','user3'],
      comments: [{id:uid(), author:'김민준', text:'저도 같은 반인데 같이 열심히 해봐요!', date: dateStr(-1)}],
      date: dateStr(-3), status: 'approved', views: 42,
    },
    {
      id: uid(), title: 'Python으로 만든 간단한 계산기 프로젝트',
      content: '수업 시간에 Python을 배우면서 처음으로 만들어본 계산기입니다.\n\n사칙연산은 물론 제곱근, 퍼센트 계산까지 구현했어요.\n아직 부족한 부분이 많지만 완성했다는 것 자체가 뿌듯합니다.\n\nGitHub에 코드를 올렸으니 관심 있으신 분들은 확인해보세요!',
      author: '박준혁', authorRole: 'student', authorGrade: '1-3',
      tags: ['Python', '프로젝트', '코딩'],
      likes: ['user1'], comments: [],
      date: dateStr(-7), status: 'approved', views: 28,
    },
    {
      id: uid(), title: '소프트웨어 교육의 방향성 — 교사 칼럼',
      content: '안녕하세요, 정보 교과 담당 교사입니다.\n\n요즘 AI와 소프트웨어 교육의 중요성이 더욱 커지고 있습니다.\n우리 학교에서는 단순 코딩 교육을 넘어, 문제 해결 능력과 창의적 사고를 기르는 교육을 지향하고 있습니다.\n\n앞으로도 학생 여러분과 함께 성장해나가겠습니다.',
      author: '김정훈 선생님', authorRole: 'teacher', authorGrade: '정보과학',
      tags: ['교육', '교사칼럼', 'AI'],
      likes: ['user1','user2','user3','user4'],
      comments: [{id:uid(), author:'이소연', text:'좋은 말씀 감사합니다!', date: dateStr(-2)}],
      date: dateStr(-10), status: 'approved', views: 85,
    },
  ];
  savePosts(demo);
}

function dateStr(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── SESSION ─────────────────────────────────────────────────────────────────
function restoreSession() {
  const s = loadObj(STORAGE.session);
  if (s) state.currentUser = s;
}
function saveSession(user) {
  state.currentUser = user;
  save(STORAGE.session, user);
}
function clearSession() {
  state.currentUser = null;
  localStorage.removeItem(STORAGE.session);
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function showPage(name, data = null) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  if (name !== state.prevPage) state.prevPage = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'home') renderHome();
  if (name === 'explore') renderExplore();
  if (name === 'admin') renderAdmin();
  if (name === 'post' && data) openPost(data);
}

function goBack() {
  showPage(state.prevPage === 'post' ? 'home' : (state.prevPage || 'home'));
}

function requireAuth(action) {
  if (!state.currentUser) {
    state.pendingAction = action;
    showPage('auth');
    toast('로그인이 필요합니다', 'error');
    return false;
  }
  if (action === 'write') showPage('write');
  return true;
}

// ─── NAV RENDER ──────────────────────────────────────────────────────────────
function renderNav() {
  const area = document.getElementById('nav-auth-area');
  if (!state.currentUser) {
    area.innerHTML = `
      <button class="nav-btn btn-primary btn-sm" onclick="showPage('auth')">로그인</button>`;
  } else {
    const u = state.currentUser;
    const isAdmin = u.role === 'admin';
    area.innerHTML = `
      <div class="user-chip ${isAdmin ? 'admin' : ''}">
        <div class="avatar">${u.name[0]}</div>
        <span>${u.name}${isAdmin ? ' 🛡' : ''}</span>
      </div>
      ${isAdmin ? `<button class="nav-btn" onclick="showPage('admin')">관리자</button>` : ''}
      <button class="nav-btn" onclick="requireAuth('write')">글쓰기</button>
      <button class="nav-btn" onclick="logout()">로그아웃</button>`;
  }
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function renderHome() {
  const container = document.getElementById('home-posts');
  const posts = getPosts().filter(p => p.status === 'approved')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
  container.innerHTML = posts.length
    ? posts.map(postCard).join('')
    : emptyState('아직 게시글이 없어요', '첫 번째 글을 작성해보세요!');
}

// ─── EXPLORE ─────────────────────────────────────────────────────────────────
function renderExplore() {
  renderTagFilters();
  filterPosts();
}

function renderTagFilters() {
  const posts = getPosts().filter(p => p.status === 'approved');
  const allTags = [...new Set(posts.flatMap(p => p.tags || []))];
  const container = document.getElementById('tag-filters');
  container.innerHTML = `
    <button class="tag-filter-btn ${!state.activeTagFilter ? 'active' : ''}" onclick="setTagFilter(null)">전체</button>
    ${allTags.map(t => `<button class="tag-filter-btn ${state.activeTagFilter===t?'active':''}" onclick="setTagFilter('${t}')">${t}</button>`).join('')}`;
}

function setTagFilter(tag) {
  state.activeTagFilter = tag;
  renderTagFilters();
  filterPosts();
}

function filterPosts() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  let posts = getPosts().filter(p => p.status === 'approved');
  if (state.activeTagFilter) posts = posts.filter(p => p.tags?.includes(state.activeTagFilter));
  if (q) posts = posts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q) ||
    p.author.toLowerCase().includes(q)
  );
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('explore-posts');
  container.innerHTML = posts.length
    ? posts.map(postCard).join('')
    : emptyState('검색 결과가 없어요', '다른 키워드로 검색해보세요');
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function postCard(post) {
  const excerpt = post.content.replace(/\n/g, ' ').slice(0, 120) + (post.content.length > 120 ? '…' : '');
  const dateLabel = formatDate(post.date);
  const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const roleIcon = post.authorRole === 'teacher' ? '👩‍🏫' : '🎒';
  return `
    <div class="post-card" onclick="showPage('post'); openPost('${post.id}')">
      <div class="post-tags">${tags}</div>
      <div class="post-card-title">${escHtml(post.title)}</div>
      <div class="post-card-excerpt">${escHtml(excerpt)}</div>
      <div class="post-card-meta">
        <div class="avatar">${post.author[0]}</div>
        <span>${roleIcon} ${escHtml(post.author)}</span>
        <span>·</span><span>${dateLabel}</span>
        <div class="post-card-actions" style="margin-left:auto">
          ❤️ ${post.likes?.length || 0}
          💬 ${post.comments?.length || 0}
          👁 ${post.views || 0}
        </div>
      </div>
    </div>`;
}

function emptyState(title, sub) {
  return `<div class="empty-state"><div class="empty-icon">📭</div><p><strong>${title}</strong></p><p>${sub}</p></div>`;
}

// ─── POST DETAIL ──────────────────────────────────────────────────────────────
function openPost(postId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  state.currentPost = postId;

  // increment views
  post.views = (post.views || 0) + 1;
  savePosts(posts);

  const isLiked = state.currentUser && post.likes?.includes(state.currentUser.id);
  const isOwner = state.currentUser && state.currentUser.name === post.author;
  const isAdmin = state.currentUser?.role === 'admin';
  const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const roleIcon = post.authorRole === 'teacher' ? '👩‍🏫' : '🎒';

  document.getElementById('post-detail-content').innerHTML = `
    <div class="post-tags" style="margin-bottom:16px">${tags}</div>
    <h1 class="post-detail-title">${escHtml(post.title)}</h1>
    <div class="post-detail-meta">
      <div class="avatar" style="width:32px;height:32px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700">${post.author[0]}</div>
      ${roleIcon} <strong>${escHtml(post.author)}</strong>
      <span>${post.authorRole === 'teacher' ? post.authorGrade : post.authorGrade + '반'}</span>
      <span>·</span><span>${formatDate(post.date)}</span>
      <span>·</span><span>👁 ${post.views}</span>
    </div>
    <div class="post-detail-body">${escHtml(post.content)}</div>
    <div class="post-detail-actions">
      <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
        ❤️ 좋아요 <span id="like-count-${post.id}">${post.likes?.length || 0}</span>
      </button>
      <button class="action-btn" onclick="sharePost('${post.id}')">🔗 공유</button>
      ${isOwner || isAdmin ? `<button class="action-btn" style="color:var(--danger)" onclick="confirmDelete('${post.id}')">🗑 삭제</button>` : ''}
      <button class="action-btn" onclick="reportPost('${post.id}')">🚩 신고</button>
    </div>`;

  renderComments(post);

  document.getElementById('comment-count').textContent = post.comments?.length || 0;

  if (state.currentUser) {
    document.getElementById('comment-form-area').innerHTML = `
      <textarea id="new-comment" placeholder="댓글을 작성하세요..."></textarea>
      <button class="btn-primary" onclick="addComment('${post.id}')">등록</button>`;
  } else {
    document.getElementById('comment-form-area').innerHTML = `
      <p style="font-size:14px;color:var(--text-muted)">댓글을 달려면 <a href="#" onclick="showPage('auth')" style="color:var(--accent)">로그인</a>이 필요합니다.</p>`;
  }
}

function renderComments(post) {
  const list = document.getElementById('comments-list');
  if (!post.comments || !post.comments.length) {
    list.innerHTML = '<p style="font-size:14px;color:var(--text-muted);padding:16px 0">첫 번째 댓글을 남겨보세요!</p>';
    return;
  }
  list.innerHTML = post.comments.map(c => {
    const canDelete = state.currentUser && (state.currentUser.name === c.author || state.currentUser.role === 'admin');
    return `
      <div class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">${escHtml(c.author)}</span>
          <span class="comment-date">${formatDate(c.date)}</span>
          ${canDelete ? `<button class="comment-delete" onclick="deleteComment('${post.id}','${c.id}')">삭제</button>` : ''}
        </div>
        <div class="comment-text">${escHtml(c.text)}</div>
      </div>`;
  }).join('');
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────
function toggleLike(postId) {
  if (!state.currentUser) { toast('로그인이 필요합니다', 'error'); return; }
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  if (!post.likes) post.likes = [];
  const idx = post.likes.indexOf(state.currentUser.id);
  if (idx === -1) post.likes.push(state.currentUser.id);
  else post.likes.splice(idx, 1);
  savePosts(posts);
  document.getElementById('like-count-' + postId).textContent = post.likes.length;
  const btn = document.querySelector(`button[onclick="toggleLike('${postId}')"]`);
  if (btn) btn.classList.toggle('liked', idx === -1);
}

function addComment(postId) {
  const text = document.getElementById('new-comment')?.value?.trim();
  if (!text) { toast('댓글 내용을 입력하세요', 'error'); return; }
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  if (!post.comments) post.comments = [];
  post.comments.push({ id: uid(), author: state.currentUser.name, text, date: new Date().toISOString() });
  savePosts(posts);
  document.getElementById('new-comment').value = '';
  document.getElementById('comment-count').textContent = post.comments.length;
  renderComments(post);
  toast('댓글이 등록되었습니다');
}

function deleteComment(postId, commentId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  post.comments = post.comments.filter(c => c.id !== commentId);
  savePosts(posts);
  document.getElementById('comment-count').textContent = post.comments.length;
  renderComments(post);
  toast('댓글이 삭제되었습니다');
}

function sharePost(postId) {
  const url = `${location.origin}${location.pathname}#post/${postId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('링크가 복사되었습니다! 🔗'));
  } else {
    toast('링크: ' + url);
  }
}

function reportPost(postId) {
  if (!state.currentUser) { toast('로그인이 필요합니다', 'error'); return; }
  const reports = getReports();
  if (reports.find(r => r.postId === postId && r.reporter === state.currentUser.name)) {
    toast('이미 신고한 게시글입니다', 'error'); return;
  }
  showModal('신고하기', '이 게시글을 신고하시겠습니까?<br><small>허위 신고 시 이용이 제한될 수 있습니다.</small>',
    [{ label: '신고하기', action: () => {
      reports.push({ id: uid(), postId, reporter: state.currentUser.name, date: new Date().toISOString() });
      saveReports(reports);
      closeModal();
      toast('신고가 접수되었습니다');
    }, style: 'btn-danger' },
    { label: '취소', action: closeModal, style: 'btn-ghost' }]
  );
}

function confirmDelete(postId) {
  showModal('게시글 삭제', '이 게시글을 삭제하시겠습니까?<br><small>삭제된 글은 복구할 수 없습니다.</small>',
    [{ label: '삭제', action: () => { deletePost(postId); closeModal(); }, style: 'btn-danger' },
    { label: '취소', action: closeModal, style: 'btn-ghost' }]
  );
}

function deletePost(postId) {
  savePosts(getPosts().filter(p => p.id !== postId));
  toast('게시글이 삭제되었습니다');
  showPage('home');
}

// ─── WRITE / SUBMIT ───────────────────────────────────────────────────────────
function setupTagInput() {
  const input = document.getElementById('tag-input');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !state.tags.includes(val) && state.tags.length < 5) {
        state.tags.push(val);
        renderTagsPreview();
      }
      input.value = '';
    }
  });
}

function renderTagsPreview() {
  const preview = document.getElementById('tags-preview');
  if (!preview) return;
  preview.innerHTML = state.tags.map((t, i) =>
    `<button class="tag-remove" onclick="removeTag(${i})">${t} ×</button>`).join('');
}

function removeTag(i) {
  state.tags.splice(i, 1);
  renderTagsPreview();
}

function submitPost() {
  const title = document.getElementById('post-title')?.value?.trim();
  const content = document.getElementById('post-content')?.value?.trim();
  if (!title) { toast('제목을 입력하세요', 'error'); return; }
  if (!content || content.length < 10) { toast('본문을 10자 이상 입력하세요', 'error'); return; }

  const post = {
    id: uid(), title, content,
    author: state.currentUser.name,
    authorRole: state.currentUser.role,
    authorGrade: state.currentUser.grade,
    tags: [...state.tags],
    likes: [], comments: [],
    date: new Date().toISOString(),
    status: 'approved',
    views: 0,
  };
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);

  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  state.tags = [];
  renderTagsPreview();

  toast('게시글이 등록되었습니다! 🎉', 'success');
  showPage('home');
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('auth-' + tab).classList.add('active');
}

function formatPhone(raw) {
  return raw.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── LOGIN ──
function sendLoginCode() {
  const raw = document.getElementById('login-phone').value.replace(/\D/g, '');
  if (raw.length !== 11) { toast('올바른 휴대폰 번호를 입력하세요', 'error'); return; }

  const users = getUsers();
  const user = users.find(u => u.phone === raw);
  if (!user) { toast('등록되지 않은 번호입니다. 먼저 회원가입해주세요', 'error'); return; }

  const code = generateCode();
  state.pendingCode = code;
  state.pendingPhone = raw;
  document.getElementById('login-code-area').style.display = 'block';

  // simulate SMS
  showModal('📱 인증번호 (시뮬레이션)', `
    <div class="phone-display">${formatPhone(raw)}</div>
    <p style="font-size:13px;color:var(--text-muted);text-align:center;margin-bottom:12px">
      실제 서비스에서는 SMS로 발송됩니다.<br>아래 번호를 입력하세요.
    </p>
    <div class="code-display">${code}</div>`,
    [{ label: '확인', action: closeModal, style: 'btn-primary' }]
  );
}

function verifyLoginCode() {
  const input = document.getElementById('login-code').value.trim();
  if (input !== state.pendingCode) { toast('인증번호가 올바르지 않습니다', 'error'); return; }

  const adminKey = document.getElementById('admin-key-input').value.trim();
  const users = getUsers();
  let user = users.find(u => u.phone === state.pendingPhone);

  if (adminKey === ADMIN_KEY) {
    user = { ...user, role: 'admin' };
    toast('관리자 모드로 로그인되었습니다 🛡', 'success');
  } else {
    toast(`환영합니다, ${user.name}님! 👋`, 'success');
  }

  saveSession(user);
  renderNav();
  state.pendingCode = null;
  state.pendingPhone = null;

  if (state.pendingAction === 'write') {
    state.pendingAction = null;
    showPage('write');
  } else {
    showPage('home');
  }
}

// ── SIGNUP ──
function sendSignupCode() {
  const raw = document.getElementById('signup-phone').value.replace(/\D/g, '');
  const name = document.getElementById('signup-name').value.trim();
  const grade = document.getElementById('signup-grade').value.trim();
  const role = document.getElementById('signup-role').value;

  if (!name) { toast('이름을 입력하세요', 'error'); return; }
  if (!grade) { toast('학년/반 또는 담당과목을 입력하세요', 'error'); return; }
  if (raw.length !== 11) { toast('올바른 휴대폰 번호를 입력하세요', 'error'); return; }

  const users = getUsers();
  if (users.find(u => u.phone === raw)) { toast('이미 가입된 번호입니다', 'error'); return; }

  const code = generateCode();
  state.pendingCode = code;
  state.pendingUser = { id: uid(), name, phone: raw, role, grade, joinDate: new Date().toISOString() };
  document.getElementById('signup-code-area').style.display = 'block';

  showModal('📱 인증번호 (시뮬레이션)', `
    <div class="phone-display">${formatPhone(raw)}</div>
    <p style="font-size:13px;color:var(--text-muted);text-align:center;margin-bottom:12px">
      실제 서비스에서는 SMS로 발송됩니다.<br>아래 번호를 입력하세요.
    </p>
    <div class="code-display">${code}</div>`,
    [{ label: '확인', action: closeModal, style: 'btn-primary' }]
  );
}

function verifySignupCode() {
  const input = document.getElementById('signup-code').value.trim();
  if (input !== state.pendingCode) { toast('인증번호가 올바르지 않습니다', 'error'); return; }

  const users = getUsers();
  users.push(state.pendingUser);
  saveUsers(users);
  saveSession(state.pendingUser);
  renderNav();
  state.pendingCode = null;
  state.pendingUser = null;

  toast(`가입 완료! 환영합니다, ${state.currentUser.name}님! 🎉`, 'success');
  if (state.pendingAction === 'write') {
    state.pendingAction = null;
    showPage('write');
  } else {
    showPage('home');
  }
}

function logout() {
  clearSession();
  renderNav();
  showPage('home');
  toast('로그아웃되었습니다');
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function renderAdmin() {
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    showPage('home'); toast('관리자 권한이 없습니다', 'error'); return;
  }
  showAdminTab('posts');
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.admin-tab-btn[onclick="showAdminTab('${tab}')"]`).classList.add('active');
  document.getElementById(`admin-${tab}-tab`).classList.add('active');

  if (tab === 'posts') renderAdminPosts();
  if (tab === 'users') renderAdminUsers();
  if (tab === 'reports') renderAdminReports();
}

function renderAdminPosts() {
  const posts = getPosts().sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('admin-posts-list');
  if (!posts.length) { container.innerHTML = emptyState('게시글 없음', ''); return; }

  container.innerHTML = posts.map(p => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <div class="admin-post-title">${escHtml(p.title)}</div>
        <div class="admin-post-meta">
          ${p.author} · ${formatDate(p.date)} · ❤️ ${p.likes?.length||0} 💬 ${p.comments?.length||0} 👁 ${p.views||0}
        </div>
      </div>
      <div class="admin-actions">
        <span class="status-badge status-${p.status === 'approved' ? 'approved' : p.status === 'rejected' ? 'rejected' : 'pending'}">
          ${p.status === 'approved' ? '승인됨' : p.status === 'rejected' ? '거절됨' : '검토중'}
        </span>
        <button class="btn-primary btn-sm" onclick="showPage('post'); openPost('${p.id}')">보기</button>
        ${p.status !== 'rejected' ? `<button class="btn-danger btn-sm" onclick="adminRejectPost('${p.id}')">숨김</button>` : ''}
        ${p.status === 'rejected' ? `<button class="btn-primary btn-sm" onclick="adminApprovePost('${p.id}')">복원</button>` : ''}
        <button class="btn-danger btn-sm" onclick="confirmDelete('${p.id}')">삭제</button>
      </div>
    </div>`).join('');
}

function renderAdminUsers() {
  const users = getUsers();
  const container = document.getElementById('admin-users-list');
  if (!users.length) { container.innerHTML = emptyState('회원 없음', ''); return; }
  container.innerHTML = users.map(u => `
    <div class="admin-user-item">
      <div class="admin-post-info">
        <div class="admin-post-title">${escHtml(u.name)} <span style="font-size:12px;color:var(--text-muted)">${u.role === 'teacher' ? '교직원' : '학생'} · ${u.grade}</span></div>
        <div class="admin-post-meta">가입일: ${formatDate(u.joinDate)} · 게시글 ${getPosts().filter(p=>p.author===u.name).length}개</div>
      </div>
      <div class="admin-actions">
        <button class="btn-danger btn-sm" onclick="adminDeleteUser('${u.id}')">탈퇴처리</button>
      </div>
    </div>`).join('');
}

function renderAdminReports() {
  const reports = getReports();
  const container = document.getElementById('admin-reports-list');
  if (!reports.length) { container.innerHTML = emptyState('신고 없음', '신고된 게시글이 없습니다'); return; }
  const posts = getPosts();
  container.innerHTML = reports.map(r => {
    const post = posts.find(p => p.id === r.postId);
    return `
      <div class="admin-report-item">
        <div class="admin-post-info">
          <div class="admin-post-title">신고: ${post ? escHtml(post.title) : '(삭제된 게시글)'}</div>
          <div class="admin-post-meta">신고자: ${escHtml(r.reporter)} · ${formatDate(r.date)}</div>
        </div>
        <div class="admin-actions">
          ${post ? `<button class="btn-primary btn-sm" onclick="showPage('post'); openPost('${r.postId}')">확인</button>
          <button class="btn-danger btn-sm" onclick="adminRejectPost('${r.postId}'); dismissReport('${r.id}')">숨김처리</button>` : ''}
          <button class="btn-ghost btn-sm" onclick="dismissReport('${r.id}')">무시</button>
        </div>
      </div>`;
  }).join('');
}

function adminRejectPost(postId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) { post.status = 'rejected'; savePosts(posts); renderAdminPosts(); toast('게시글이 숨김 처리되었습니다'); }
}

function adminApprovePost(postId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) { post.status = 'approved'; savePosts(posts); renderAdminPosts(); toast('게시글이 복원되었습니다', 'success'); }
}

function adminDeleteUser(userId) {
  showModal('회원 탈퇴 처리', '정말로 이 회원을 탈퇴 처리하시겠습니까?',
    [{ label: '탈퇴처리', action: () => {
      saveUsers(getUsers().filter(u => u.id !== userId));
      closeModal(); renderAdminUsers(); toast('회원이 탈퇴 처리되었습니다');
    }, style: 'btn-danger' },
    { label: '취소', action: closeModal, style: 'btn-ghost' }]
  );
}

function dismissReport(reportId) {
  saveReports(getReports().filter(r => r.id !== reportId));
  renderAdminReports();
  toast('신고가 처리되었습니다');
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function showModal(title, body, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${title}</div>
    <div class="modal-text">${body}</div>
    <div class="modal-actions">
      ${actions.map(a => `<button class="${a.style}" onclick="(${a.action.toString()})()">${a.label}</button>`).join('')}
    </div>`;
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 2592000) return Math.floor(diff / 86400) + '일 전';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
