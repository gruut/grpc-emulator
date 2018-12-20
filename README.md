# emulator with nodejs
* nodejs로 만든 grcp 네트워크 에뮬레이터입니다.
- 현재는 tx generator만 사용됩니다.
- merger, signer는 바이트핸들링 참고용으로만 남겨둡니다.
* [grpc nodejs 빠른 시작](https://grpc.io/docs/quickstart/node.html)
* 디렉토리 구조는 다음과 같습니다.
```
$ tree
.
.
├── package.json
├── package-lock.json
├── protos
│   ├── pull_merger.proto
│   └── tx.proto
├── README.md
└── src
    ├── common.js
    ├── logs
    ├── merger.js
    ├── mytools.js
    ├── signer.js
    └── tx_generator.js

```

### 어떻게 사용해요?
* 필요한 노드 모듈을 설치합니다.
```
npm install
```

### merger 실행
```
~~node merger.js addr port~~
```

### signer 실행
```
~~node signer.js addr port n(signer number, optional)~~
```

- merger와 signer는 grpc를 이용하여 byte encoded data를 송수신합니다.

### tx_generator 실행
```
npm run txgen address port n(se emulator number, default: 1)
```
- tx generator는 SE의 트랜잭션을 에뮬레이션합니다.
- tx generator의 RSA 서명키는 하드코딩되어있습니다.
- tx generator는 addr:port로 지정된 머저에게 tx를 발송합니다.
- tx generator가 발생시키는 content의 배열은 1개 이상이며, 랜덤하게 생성됩니다.