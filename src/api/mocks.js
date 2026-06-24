// Начальные мок-данные
let groups = [
  { id: 1, name: 'Группа 101' },
  { id: 2, name: 'Группа 102' },
  { id: 3, name: 'Группа 103' },
]

let works = [
  { id: 1, title: 'Лабораторная №1', description: 'Описание ЛР1', deadline: '2026-07-01T23:59', groupId: 1 },
  { id: 2, title: 'Лабораторная №2', description: 'Описание ЛР2', deadline: '2026-07-15T23:59', groupId: 1 },
  { id: 3, title: 'Курсовая', description: 'Описание курсовой', deadline: '2026-08-01T23:59', groupId: 2 },
]

let submissions = [
  { id: 1, workId: 1, studentId: 2, studentName: 'Студент Иванов', status: 'pending', file: 'file1.pdf', grade: null, comment: null },
  { id: 2, workId: 1, studentId: 3, studentName: 'Студент Петров', status: 'uploaded', file: 'file2.pdf', grade: null, comment: null },
  { id: 3, workId: 2, studentId: 2, studentName: 'Студент Иванов', status: 'graded', file: 'file3.pdf', grade: 85, comment: 'Хорошо' },
]

let nextGroupId = 4
let nextWorkId = 4
let nextSubmissionId = 4

// --- Моки для аутентификации (с groupId) ---
export const mockLogin = (login, password) => {
  if (login === 'teacher' && password === '123') {
    return {
      token: 'fake-token-teacher',
      user: { id: 1, name: 'Преподаватель', role: 'teacher' }
    }
  }
  if (login === 'student' && password === '123') {
    return {
      token: 'fake-token-student-1',
      user: { id: 2, name: 'Студент Иванов', role: 'student', groupId: 1 }
    }
  }
  if (login === 'student2' && password === '123') {
    return {
      token: 'fake-token-student-2',
      user: { id: 3, name: 'Студент Петров', role: 'student', groupId: 2 }
    }
  }
  throw new Error('Неверный логин или пароль')
}

export const mockProfile = (token) => {
  if (token === 'fake-token-teacher') {
    return { id: 1, name: 'Преподаватель', role: 'teacher' }
  }
  if (token === 'fake-token-student-1') {
    return { id: 2, name: 'Студент Иванов', role: 'student', groupId: 1 }
  }
  if (token === 'fake-token-student-2') {
    return { id: 3, name: 'Студент Петров', role: 'student', groupId: 2 }
  }
  throw new Error('Невалидный токен')
}

// --- Моки для групп ---
export const mockGetGroups = () => {
  return [...groups] // возвращаем копию
}

export const mockCreateGroup = (name) => {
  const newGroup = { id: nextGroupId++, name }
  groups.push(newGroup)
  return newGroup
}

// --- Моки для работ ---
export const mockGetWorksByGroup = (groupId) => {
  return works.filter(w => w.groupId === groupId)
}

export const mockCreateWork = (workData) => {
  const newWork = {
    id: nextWorkId++,
    ...workData,
  }
  works.push(newWork)
  return newWork
}

export const mockGetWorkById = (workId) => {
  return works.find(w => w.id === workId)
}

// --- Моки для сдач ---
export const mockGetSubmissionsByWork = (workId) => {
  return submissions.filter(s => s.workId === workId)
}

export const mockSubmitWork = (workId, studentId, file) => {
  // В реальности файл бы загружался, а мы просто добавим запись
  const student = [{ id: 2, name: 'Студент Иванов' }, { id: 3, name: 'Студент Петров' }].find(s => s.id === studentId)
  const newSubmission = {
    id: nextSubmissionId++,
    workId,
    studentId,
    studentName: student ? student.name : 'Неизвестный',
    status: 'pending',
    file: file ? file.name : 'file.pdf',
    grade: null,
    comment: null,
  }
  submissions.push(newSubmission)
  return newSubmission
}

export const mockGradeSubmission = (submissionId, grade, comment) => {
  const sub = submissions.find(s => s.id === submissionId)
  if (sub) {
    sub.status = 'graded'
    sub.grade = grade
    sub.comment = comment
    return sub
  }
  throw new Error('Сдача не найдена')
}