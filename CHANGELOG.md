## 0.7.0

- 对于未在 `namespace HTTP` 里声明的接口，现在返回类型为 `unknown` 而非 `any`。

## 0.6.0

- `useMock` 方法里现在可以直接写响应体，不必包裹在一个函数里。
- `transformResponse` 方法现在能接收到先前的解析错误。
- 使用 `q.setOptions` 取代 `q.defaults`
