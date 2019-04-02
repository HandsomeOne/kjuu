# Q /`kjuu`/ for reQuest

新一代 HTTP 请求库

### 轻量

基于 Fetch API 开发，轻量无依赖，代码压缩并 gzip 后仅 1.8 kb；

### 稳健

- 采用 TypeScript 开发，有完整的类型声明；
- 采用 Jest 进行单元测试，覆盖率 100%；

### 易用

- 提供与 HTTP 请求方法同名的便捷方法；
- **提供全局 HTTP 接口类型定义与 mock 解决方案，让联调更省心**；
- 提供请求体包装函数，可将普通对象包装成 FormData、URLSearchParams 或者 JSON 格式；
- 支持请求前和返回后传入钩子函数；
- 提供将请求配置转换为 URL 的工具函数，常用于为 `<a>` 标签设置 `href` 属性；
- 取返回头的值时，键名不用区分大小写。

## 安装与引入

使用 npm：

```sh
npm install kjuu
```

使用 yarn：

```sh
yarn add kjuu
```

引入：

```js
import q from 'kjuu'
```

## 兼容性

支持最新版的 Firefox、Chrome、Edge、Safari、QQ 浏览器。

如果在旧式浏览器遇到了兼容性问题，视情况自行 polyfill 即可。

- 浏览器不支持 `fetch`：采用 [`whatwg-fetch`](https://www.npmjs.com/package/whatwg-fetch)；
- 浏览器不支持 `URLSearchParams`：采用 [`url-search-params`](https://www.npmjs.com/package/url-search-params)；
- 浏览器不支持 `Proxy`：采用如下的 polyfill。再取返回头时，键名必须全小写。

```js
window.Proxy =
  window.Proxy ||
  function(x) {
    return x
  }
```

# 开始使用

## 基本用法

设想一个简单的用户管理的情景。

```js
import q from 'kjuu'

q.setOptions({ baseUrl: 'http://your.machine' })

// 获取第一页的用户列表
// 实际请求地址会被拼接成 http://your.machine/user?limit=10&offset=0
q.get('/userlist', { limit: 10, offset: 0 }).then(res => {
  console.log(res.body)
  // body 字段会自动进行 JSON 反序列化
  // <object> {
  //   total: 42,
  //   data: [ { id: 1, name: 'pony' }, ... ],
  // },
})

// 创建用户
q.post(
  '/user',
  // q.JSON 显式地标明请求体会以 JSON 格式发送
  // 其内容会被序列化，并且请求头将带上 Content-Type: application/json
  // 并列的方法还有 q.URLSearchParams 和 q.FormData
  q.JSON({ name: 'tony' }),
).then(res => {
  console.log(res.body)
  // <string> '创建成功'
})
```

现在假设项目定义了一些业务状态码，所有接口都修改成了 `{ code: <业务状态码>, message: <返回结果> }` 的形状。那么前端需要一个统一的方法来处理这些状态码：

```js
q.setOptions({
  transformResponse(res) {
    if (res.body.code === 'OK') {
      // 只返回 message 字段
      return res.body.message
    }
    // 未登录
    if (res.body.code === 'NOT_LOGGED_IN') {
      login()
      return
    }
    // 其他情况抛出异常
    throw new Error(res.body.code)
  },
})

q.get('/userlist', { limit: 10, offset: 0 }).then(res => {
  console.log(res)
  // 这时候的 res 是 transformResponse 函数处理后的结果
  // <object> {
  //   total: 42,
  //   data: [ { id: 1, name: 'pony' }, ... ],
  // },
})
```

## 声明接口类型

如果你对项目正在使用 TypeScript 的话，你可以通过扩展全局命名空间 `HTTP` 来定义接口的形状，从而得到完整的类型提示。

```ts
// global.d.ts
declare namespace HTTP {
  // 注意！如果有 transformResponse，
  // 应该书写转化过之后的类型，而不是 HTTP 返回体原本的类型
  // 即 q.get('/userlist').then(res => {}) 中，res 的类型

  // ANY 表示任意 HTTP 请求方法
  interface ANY {
    '/userlist': {
      total: number
      data: User[]
    }
  }

  interface GET {
    '/user': User
  }

  // 相同的请求地址，可以根据请求方法的不同，进行类型区分
  interface POST {
    '/user': string
  }

  interface User {
    id: number
    name: string
  }
}
```

![](http://km.oa.com/files/photos/pictures/201903/1551861824_59_w600_h180.gif)

如果后端接口已经就绪了，而你又在用 VS Code 编辑器，那么可以用插件 [Paste JSON as Code](https://marketplace.visualstudio.com/items?itemName=quicktype.quicktype) 从接口内容生成类型定义。

否则，在后端接口没有就绪、前端先行的情况下，你可能需要一个 mock 方案。使用 kjuu 进行 mock 是很简单的，只需要在项目入口处调用函数 `q.useMock` 就可以了。当然，mock 只会在开发环境生效。

```js
// 传入一个对象，键为要匹配的 URL，值为响应体或者响应体的工厂函数
// 当 q.get、q.post 等方法的 URL 精确匹配键名时，将用对应函数的返回值作为响应主体
q.useMock({
  '/userlist': {
    total: 42,
    data: [
      {
        id: 1,
        name: 'pony',
      },
    ],
  }),
})

// 也可以只 mock 某一种请求方法
q.useMock('get', {
  '/user': { id: 1, name: 'pony' },
})
q.useMock('post', {
  '/user': '创建成功',
})
```

## 上传与下载

在 HTTP 协议中，文件通常是通过 form-data 格式进行传输的。

```js
q.post(
  '/uploadfiles',
  q.FormData({
    // file1, file2 均为 File 对象
    files: [file1, file2],
  }),
)
```

要下载文件时，将 `responseType` 设定为 `blob` 就能得到文件对象。

```js
// file-saver 用于保存文件到本地
import { saveAs } from 'file-saver'

q.get(
  '/downloadfile',
  { id: 1 },
  {
    responseType: 'blob',
    transformResponse: null, // 覆盖默认转换返回体的行为
  },
).then(res => {
  saveAs(res.body, 'filename.txt')
})
```

## 绑定另一个默认配置

采用 `q.extend` 方法，可以创建绑定另一个默认配置的实例。

```js
q.setOptions({
  baseUrl: 'http://a.com',
  responseType: 'text',
})

const q2 = q.extend({
  baseUrl: 'http://b.com',
})
// q2 的默认配置为 {
//   baseUrl: 'http://b.com',
//   responseType: 'text',
// }
// 也就是说，q.get 会向 a.com 发请求，q2.get 则为 b.com
```

## 取消请求

由于 `q` 是基于 Fetch 构建的，这里采用了 Fetch 的内置方案 [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)。

```js
const controller = new AbortController()
setTimeout(() => controller.abort(), 1000)

q.get('/someapi', {}, { signal: controller.signal })
  .then(res => {
    console.log(res)
  })
  .catch(e => {
    if (e.name === 'AbortError') {
      console.log('Fetch aborted')
    } else {
      console.error('Fetch error:', e)
    }
  })
```

# API

kjuu 提供了完整的类型声明文件。

## request

```ts
q.request(options: QRequest): Promise<QResponse | any>

// 除了 body、headers、method 之外，options 的其他属性都会透传给 fetch
interface QRequest
  extends Pick<
    RequestInit,
    Exclude<keyof RequestInit, 'body' | 'headers' | 'method'>
  > {
  // 请求地址，最终与 baseUrl、params 一同拼接成实际地址
  url?: string

  // 请求方法
  method?: string

  // 基底请求地址，按路径拼接规则拼接在 url 之前
  baseUrl?: string

  // 请求头对象，undefined 和 null 的值会被忽略
  headers?: Record<string, string | undefined | null>

  // 请求参数，会按照 URLSearchParams 格式拼接在 url 后面
  // ParamsInit 为任意深度的对象或数组的结合体，其叶子节点必须为 JS 的基本类型
  params?: URLSearchParams | ParamsInit | null

  // 请求主体，get 和 head 方法不可有此字段
  // 其中 JASON 为 q.JSON() 的返回类型
  body?:
    | JASON
    | Blob
    | BufferSource
    | FormData
    | URLSearchParams
    | ReadableStream
    | string
    | null

  // 是否发送 cookie，默认为 undefined
  // undefined：仅在同源请求发送 cookie
  // true：总是发送 cookie
  // false：总是不发送 cookie
  withCredentials?: boolean

  // 返回体将按何种格式解析，默认为 json
  responseType?: 'arrayBuffer' | 'blob' | 'json' | 'text' | 'formData'

  // 发送请求前的钩子函数
  transformRequest?: ((options: QRequest) => QRequest) | null

  // 收到返回后的钩子函数
  transformResponse?: ((response?: QResponse, error?: any) => any) | null

  // mock 函数的延迟毫秒数。如果为区间，则取区间内的随机值
  mockDelay?: number | [number, number]
}
}
```

```ts
// 提到的这些属性，将从 fetch 的 response 对象透传给 q 的返回体
interface QResponse
  extends Pick<
    Response,
    'ok' | 'redirected' | 'status' | 'statusText' | 'url' | 'type'
  > {
  // 返回主体，其类型由请求的 responseType 决定
  body: any

  // 返回头对象，键名大小写不敏感
  headers: Record<string, string | undefined>
}
```

## get, post, ...

```ts
q.get(url: string, params: QRequest['params'], options?: QRequest)
q.head(url: string, params: QRequest['params'], options?: QRequest)

q.post(url: string, body: QRequest['body'], options?: QRequest)
q.put(url: string, body: QRequest['body'], options?: QRequest)
q.patch(url: string, body: QRequest['body'], options?: QRequest)
q.delete(url: string, body: QRequest['body'], options?: QRequest)
```

## JSON, URLSearchParams, FormData

```ts
// 表示 JSON 格式的请求体，对应的 Content-Type 为 application/json
q.JSON(value: any): JASON

// 表示 URLSearchParams 格式的请求体，对应的 Content-Type 为 application/x-www-form-urlencoded
// ParamsInit 为任意深度的对象或数组的结合体，其叶子节点必须为 JS 的基本类型
q.URLSearchParams(value?: URLSearchParams | ParamsInit | null): URLSearchParams

// 表示 URLSearchParams 格式的请求体，对应的 Content-Type 为 multipart/form-data
// FormDataInit 类似 ParamsInit，不过叶子节点允许为 Blob 对象
q.FormData(value?: FormData | FormDataInit | null): FormData
```

## href

将请求配置转化为 url 字符串。

```ts
q.href(url: string, params?: QRequest['params']): string
```

## setOptions

设置默认选项。

```ts
q.setOptions(options: QRequest): void
```

## extend

采用新的默认配置，创建另一个实例。

```ts
q.extend(options?: QRequest): typeof q
```

## mock

配置 mock 选项。

```ts
q.useMock([method,] mock: {})
```
