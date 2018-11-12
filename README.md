# emulator with nodejs
nodejs로 만든 네트워크 에뮬레이터입니다.
[grpc nodejs 빠른 시작](https://grpc.io/docs/quickstart/node.html)
위 페이지를 참고해서 프로젝트를 구성했다면,
```
(grpc_home)/examples/node/
```
디렉토리로 이동한 뒤 이 저장소를 clone하세요. 이 저장소는 grpc 프로젝트의 submodule이므로 아래 명령어로 추가해야 합니다. 디렉토리명은 `emu` 입니다.
```
git submodule add git@gitlab.com:gruut/grcp-emu.git emu
```
emu 디렉토리는 src와 protos로 나뉩니다.
```
$ tree
.
├ protos
│   └ dos_hello.proto
└ src
    └ dos_greeter_client.js
```

### 어떻게 사용해요?
* 서버는 하나의 코드로 구성할 계획이예요.
* 클라이언트는 작업 용도에 따라 개수가 늘어나겠죠?
* 서버는 aws에서 동작하고, client는 여러분의 ubuntu console에서 실행하면 돼요.
    *서버주소:  13.125.119.50:50051 ( gruut 웹서버 공유중... )
* 서버 코드를 작성했을 때 반영되도록 하는 멋진 일은 조금 뒤에 할게요.
