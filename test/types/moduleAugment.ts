import q from '../../src'

declare global {
  namespace HTTP {
    // 以任意请求方法请求 ANY 中的接口，
    interface ANY {
      '/userlist': {
        total: number
        data: User[]
      }
    }

    interface GET {
      '/user': User
    }

    interface POST {
      '/user': string
    }

    interface User {
      id: number
      name: string
    }
  }
}

;(async () => {
  // tslint:disable:no-unused-expression
  ;(await q.get('/userlist')).data.forEach(user => user.name)
  ;(await q.post('/user')).toLowerCase()
  ;(await q.get('/user')).id
})()

q.useMock({
  '/userlist': () => ({
    total: 42,
    data: [
      {
        id: 1,
        name: 'pony',
      },
    ],
  }),
})
q.useMock('get', {
  '/user': () => ({ id: 1, name: 'pony' }),
  '/newapi': () => 1,
})
q.useMock('post', {
  '/user': () => '创建成功',
})
q.useMock('put', {
  '/user': { id: 1, name: 'pony' },
})
