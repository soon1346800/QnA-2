import express from 'express';
import users from './dummy/users.json' assert { type: 'json' };
import questions from './dummy/questions.json' assert { type: 'json' };
import answers from './dummy/answers.json' assert { type: 'json' };

const app = express();
const port = 3000;

app.use(express.json());

// 유저 전체 조회
app.get('/users', (req, res) => {
  res.send(users);
});

// 회원가입
app.post('/signup', (req, res) => {
  const { email, password, passwordCheck, role } = req.body;

  if (!email || !password || !passwordCheck || !role) {
    return res.status(400).send('값을 모두 입력해주세요.');
  }
  if (password !== passwordCheck) {
    return res.status(400).send('비밀번호가 일치하지 않습니다.');
  }

  const existedUser = users.find((user) => user.email === email);
  if (existedUser) {
    return res.status(400).send('이미 유저가 존재합니다.');
  }

  const newId = users.length > 0 ? users[users.length - 1].id + 1 : 1;
  const newUser = {
    id: newId,
    email,
    password,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.push(newUser);
  res.send(newUser);
});

// 로그인
app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('값을 모두 입력해주세요.');
  }

  const user = users.find(
    (user) => user.email === email && user.password === password,
  );
  if (!user) {
    return res.status(401).send('존재하지 않는 사용자입니다.');
  }

  const showUser = {
    id: user.id,
    email,
    role: user.role,
  };
  res.send(showUser);
});

// 매니저 승격
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('값을 모두 입력해주세요.');
  }
  // 매니저라면, 다른 user의 role 변경 가능.
  const manager = users.find(
    (manager) => manager.email == email && manager.password == password,
  );
  if (manager.role !== 'MANAGER') {
    return res.status(403).send('승격 권한이 없습니다.');
  }
  const user = users.find((user) => user.id == id);
  const updatedUser = { ...user, role: 'MANAGER', updatedAt: new Date() };
  return res.send(updatedUser);
});

// 질문글 CRUD
// 익명 게시판으로 작성자 표기 X
// 매니저의 경우 작성자 확인 가능
// 질문글 리스트 20개 노출
// 당사자와 매니저만 삭제 가능
// 작성시간, 수정시간이 입력
app.get('/quest/search', (req, res) => {
  const { keyword } = req.query;
  const searchedQuest = questions.filter((quest) =>
    quest.title.includes(keyword),
  );
  res.send(searchedQuest);
});

app.get('/quest', (req, res) => {
  res.json(questions);
});

app.get('/quest/:id', (req, res) => {
  const { id } = req.params;
  const quest = questions.find((quest) => quest.id == id);
  if (!quest) {
    res.status(404).send('존재하지 않는 질문 입니다.');
  }
  res.send(quest);
});

app.post('/quest', (req, res) => {
  const { email, title, description } = req.body;
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(403).send('존재하지 않는 사용자입니다.');
  }
  if (!title || !description) {
    return res.status(400).send('질문을 작성해주세요.');
  }

  const newId =
    questions.length > 0 ? questions[questions.length - 1].id + 1 : 1;
  const newQuest = {
    id: newId,
    title,
    description,
    userId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  res.send(newQuest);
});

app.put('/quest/:id', (req, res) => {
  const { id } = req.params;
  const { email, password, title, description } = req.body;
  if (!email || !password || !title || !description) {
    return res.status(400).send('모두 입력해주세요.');
  }

  const index = users.findIndex((user) => `${user.id}` === id);
  const user = users[index];
  if (email !== user.email || password !== user.password) {
    res.status(400).send('이메일과 비밀번호가 일치하지 않습니다.');
  }
  // 질문에 답변이 존재하면 수정 X
  //

  const updatedQuest = {
    id,
    title,
    description,
    userId: user.id,
    createdAt: users[index].createdAt,
    updatedAt: new Date(),
  };
  questions.splice(index, 1, updatedQuest);
  res.send(updatedQuest);
});

app.delete('/quest/:id', (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('모두 입력해주세요.');
  }

  const index = users.findIndex((user) => `${user.id}` === id);
  const user = users[index];
  if (email !== user.email || password !== user.password) {
    res.status(400).send('이메일과 비밀번호가 일치하지 않습니다.');
  }

  questions.splice(index, 1);
  res.send('질문이 삭제 되었습니다.');
});

// 답변글 CRUD
// 답변을 하나만 채택 가능
// 채택 취소 가능
// 다른 답변을 채택하면 기존 답변 취소
// 채택 답변 삭제 불가

app.get('/quest/:id/answer', (req, res) => {
  const { id } = req.params;
  const quest = questions.find((quest) => quest.id == id);
  if (!quest) {
    res.status(404).send('존재하지 않는 질문 입니다.');
  }
  // 질문 id와 일치하는 답변들 send
  res.send();
});

app.post('/quest/:id/answer', (req, res) => {
  const { id } = req.params;
  const { email, description } = req.body;
  if (!email || !description) {
    return res.status(400).send('모두 입력해주세요.');
  }

  const user = users.find((user) => user.email === email);
  const quest = questions.find((quest) => quest.id == id);
  if (!quest) {
    return res.status(400).send('질문이 존재 하지 않습니다.');
  }
  const newId = answers.length > 0 ? answers[answers.length - 1].id + 1 : 1;
  const newAnswer = {
    id: newId,
    description,
    userId: user.id,
    questId: quest.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  res.send(newAnswer);
});

app.put('/quest/:id/answer/:answerId', (req, res) => {
  // 채택 기능
  const { id, answerId } = req.params;
  const { email, password, description } = req.body;
  if (!email || !password || !description) {
    return res.status(400).send('모두 입력해주세요.');
  }
  const answerIndex = answers.findIndex(
    (answer) => `${answer.id}` === answerId,
  );
  const answer = answers[answerIndex];
  const userIndex = users.findIndex((user) => `${user.id}` === answer.userId);
  const user = users[userIndex];
  if (email !== user.email || password !== user.password) {
    res.status(400).send('이메일과 비밀번호가 일치하지 않습니다.');
  }
  const updatedAnswer = {
    ...answer,
    description,
    updatedAt: new Date(),
  };
  answers.splice(answerIndex, 1, updatedAnswer);
  res.send(updatedAnswer);
});

app.delete('/quest/:id/answer/:answerId', (req, res) => {
  res.send('답변글 삭제 완료');
  // req.params에서 질문id와 답변id
  // req.body에서 이메일과 비밀번호
  // req.body 값을 모두 작성해야 한다.
  // db에서 답변 아이디에 해당하는 답변을 조회한다.
  // db에서 답변을 작성한 유저 아이디로 유저를 조회한다.
  // 해당 유저와 body에서 받은 유저를 대조한다. (해당 답변글을 작성한 유저)
  // db에서 이메일로 유저를 조회한다.
  // 해당 유저의 role이 매니저인지 확인한다. (매니저인 경우)
  // 해당 질문에 있는 답변글을 삭제한다.
});

app.listen(port, () => {
  console.log(`${port}번 포트를 열었습니다.`);
});
