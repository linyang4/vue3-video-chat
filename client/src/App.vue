<template>
  <div>
    <div v-show="!dialogShow" class="container">
      <div class="video-wrap">
        <el-row :gutter="24">
          <el-col :span="userVideoShow ? 12 : 24">
            <div class="user-info">
              <span>用户姓名: {{ curUserName }}</span>
              <span>用户ID: {{ curUserId }}</span>
            </div>
            <video id="my-video" class="video" autoPlay muted />
          </el-col>
          <el-col v-show="userVideoShow" :span="12">
            <div class="user-info">
              <span>用户姓名: {{ toUserName }}</span>
              <span>用户ID: {{ toUserId }}</span>
            </div>
            <video id="user-video" class="video" autoPlay muted />
          </el-col>
        </el-row>
      </div>
      <div
        style="
          display: inline-block;
          max-width: 500px;
          width: 100%;
          margin-top: 24px;
        "
      >
        <el-input v-model="toUserId" placeholder="输入用户id" />
        <el-button
          style="
            width: 100%;
            margin-top: 12px;
            background: #2c3e50;
            color: #fff;
          "
          icon="el-icon-phone"
          :loading="calling"
          @click="callUser"
        >
          {{ calling ? "正在呼叫..." : "呼叫" }}
        </el-button>
      </div>
      <div v-if="waitingCall" class="notification">
        <span>{{ toUserName }} 正在呼叫...</span>
        <el-button
          style="background: #2c3e50; color: #fff"
          icon="el-icon-phone"
          size="small"
          @click="acceptCall"
        >
          接听
        </el-button>
      </div>
    </div>
    <el-dialog
      :width="500"
      title="输入用户名继续"
      center
      :model-value="dialogShow"
      :show-close="false"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="curUserName"
        placeholder="请输入用户名"
        @keyup.enter="confirmName"
      />
    </el-dialog>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { ElMessage } from "element-plus";
import { ref, onMounted, computed } from "vue";
export default {
  name: "App",
  setup() {
    const curUserId = ref("");
    const dialogShow = ref(true);
    const curUserName = ref("");
    const myStream = ref(null);
    const toUserId = ref("");
    const toUserName = ref("");
    const toUserSignal = ref(null);

    const $myVideo = ref(null);
    const $userVideo = ref(null);

    const accepted = ref(false);
    const callEnded = ref(false);

    const waitingCall = ref(false);

    // 正在呼叫
    const calling = ref(false);

    const connection = ref(null);

    const socket = io("http://localhost:3001");
    socket.on("connected", function (data) {
      curUserId.value = data;
    });

    socket.on("waiting-accept", ({ id, name, signal }) => {
      toUserId.value = id;
      toUserName.value = name;
      toUserSignal.value = signal;
      waitingCall.value = true;
    });

    onMounted(() => {
      $myVideo.value = document.getElementById("my-video");
      $userVideo.value = document.getElementById("user-video");
    });

    const userVideoShow = computed(() => {
      return accepted.value && !callEnded.value;
    });

    function connectCamera() {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myStream.value = stream;
          $myVideo.value.srcObject = stream;
        });
    }

    const confirmName = () => {
      if (!curUserName.value || !curUserName.value.trim()) {
        ElMessage.error("请输入用户名");
      } else {
        dialogShow.value = false;
        connectCamera();
      }
    };

    const callUser = () => {
      calling.value = true;
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: myStream.value,
      });

      peer.on("signal", (signal) => {
        socket.emit("call-user", {
          fromUser: { id: curUserId.value, name: curUserName.value, signal },
          toUserId: toUserId.value,
        });
      });

      peer.on("stream", (stream) => {
        calling.value = false
        $userVideo.value.srcObject = stream;

      });

      socket.on("accepted", ({ id, name, signal }) => {
        accepted.value = true;
        peer.signal(signal);
        toUserName.value = name;
        toUserId.value = id;
        connection.value = peer;
      });
    };

    const acceptCall = () => {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: myStream.value,
      });
      peer.on("signal", (signal) => {
        socket.emit("call-accept", {
          fromUser: { id: curUserId.value, name: curUserName.value, signal },
          toUserId: toUserId.value,
        });
      });
      peer.on("stream", (stream) => {
        waitingCall.value = false
        accepted.value = true;
        $userVideo.value.srcObject = stream;
      });
      peer.signal(toUserSignal.value);
    };

    return {
      curUserId,
      curUserName,
      toUserId,
      toUserName,
      dialogShow,
      confirmName,
      myStream,
      accepted,
      callEnded,
      userVideoShow,
      callUser,
      acceptCall,
      waitingCall,
      calling,
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 24px 24px 0 0;
}

.container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.user-info {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 16px;
  background-color: #2c3e50;
  color: #fff;
}

.video-wrap {
  font-size: 0;
}

.notification {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  white-space: nowrap;
  align-items: center;
}

.video {
  width: 100%;
}
</style>
