<script setup>
import { ref, reactive, onUnmounted } from 'vue'

const WS_URL = 'ws://localhost:3000'
const HTTP_URL = 'http://localhost:3000'

const ws = ref(null)
const wsStatus = ref('Disconnected')
const questions = reactive([])
const logs = reactive([])

const newTitle = ref('')
const newBody = ref('')
const newOptions = ref('')
const replyText = ref({})

function addLog(type, message) {
  logs.unshift({ type, message, time: new Date().toLocaleTimeString() })
}

function connect() {
  if (ws.value) return
  wsStatus.value = 'Connecting...'
  const socket = new WebSocket(WS_URL)

  socket.onopen = () => {
    wsStatus.value = 'Connected'
    addLog('info', 'WebSocket connected')
  }

  socket.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data)
      switch (type) {
        case 'question:new':
          questions.push(payload)
          addLog('success', `Question created: "${payload.title}"`)
          break
        case 'question:updated':
          {
            const q = questions.find((x) => x.id === payload.id)
            if (q) {
              q.votes = payload.votes
              addLog('vote', `Vote updated on "${q.title}"`)
            }
          }
          break
        case 'question:replied':
          {
            const q = questions.find((x) => x.id === payload.id)
            if (q) {
              q.replies.push(payload.reply)
              addLog('reply', `Reply added to "${q.title}"`)
            }
          }
          break
        case 'error':
          addLog('error', `Server error: ${payload.message}`)
          break
        default:
          addLog('info', `Unknown event: ${type}`)
      }
    } catch {
      addLog('error', 'Failed to parse message')
    }
  }

  socket.onerror = () => {
    wsStatus.value = 'Error'
    addLog('error', 'WebSocket error')
  }

  socket.onclose = () => {
    wsStatus.value = 'Disconnected'
    addLog('info', 'WebSocket disconnected')
    ws.value = null
  }

  ws.value = socket
}

function disconnect() {
  if (ws.value) {
    ws.value.close()
  }
}

function send(type, payload) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type, payload }))
  } else {
    addLog('error', 'WebSocket not connected')
  }
}

function createQuestion() {
  if (!newTitle.value.trim()) return
  const options = newOptions.value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  send('question:create', {
    title: newTitle.value.trim(),
    body: newBody.value.trim(),
    options,
  })
  newTitle.value = ''
  newBody.value = ''
  newOptions.value = ''
}

function vote(questionId, option) {
  send('question:vote', { questionId, option })
}

function sendReply(questionId) {
  const body = replyText.value[questionId]
  if (!body || !body.trim()) return
  send('question:reply', { questionId, body: body.trim() })
  replyText.value[questionId] = ''
}

async function healthCheck() {
  try {
    const res = await fetch(HTTP_URL)
    const text = await res.text()
    addLog('success', `HTTP GET / → ${res.status} "${text}"`)
  } catch (e) {
    addLog('error', `HTTP GET / failed: ${e.message}`)
  }
}

onUnmounted(() => {
  if (ws.value) ws.value.close()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <div class="max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-purple-400">Backend Test Panel</h1>
        <div class="flex items-center gap-3">
          <span
            class="inline-block w-3 h-3 rounded-full"
            :class="{
              'bg-green-400': wsStatus === 'Connected',
              'bg-yellow-400': wsStatus === 'Connecting...',
              'bg-red-400': wsStatus === 'Error' || wsStatus === 'Disconnected',
            }"
          ></span>
          <span class="text-sm text-gray-400">{{ wsStatus }}</span>
          <button
            v-if="wsStatus === 'Disconnected'"
            class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition"
            @click="connect"
          >
            Connect
          </button>
          <button
            v-else
            class="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
            @click="disconnect"
          >
            Disconnect
          </button>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left column: Forms -->
        <div class="lg:col-span-1 space-y-4">

          <!-- Health Check -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">HTTP Health Check</h2>
            <button
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
              @click="healthCheck"
            >
              GET /
            </button>
          </div>

          <!-- Create Question -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Create Question</h2>
            <div class="space-y-3">
              <input
                v-model="newTitle"
                placeholder="Title"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-purple-500"
              />
              <textarea
                v-model="newBody"
                placeholder="Body (optional)"
                rows="2"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-purple-500"
              ></textarea>
              <input
                v-model="newOptions"
                placeholder="Options (comma separated, e.g. Yes,No,Maybe)"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition disabled:opacity-50"
                :disabled="!newTitle.trim()"
                @click="createQuestion"
              >
                Send question:create
              </button>
            </div>
          </div>

          <!-- Logs -->
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Activity Log</h2>
              <button
                class="text-xs text-gray-500 hover:text-gray-300 transition"
                @click="logs.length = 0"
              >
                Clear
              </button>
            </div>
            <div class="space-y-1 max-h-80 overflow-y-auto text-xs font-mono">
              <div
                v-for="(log, i) in logs"
                :key="i"
                class="px-2 py-1 rounded"
                :class="{
                  'bg-green-900/40 text-green-300': log.type === 'success',
                  'bg-red-900/40 text-red-300': log.type === 'error',
                  'bg-blue-900/40 text-blue-300': log.type === 'info',
                  'bg-yellow-900/40 text-yellow-300': log.type === 'vote',
                  'bg-purple-900/40 text-purple-300': log.type === 'reply',
                }"
              >
                <span class="text-gray-500">[{{ log.time }}]</span> {{ log.message }}
              </div>
              <div v-if="logs.length === 0" class="text-gray-600 italic">No activity yet</div>
            </div>
          </div>

        </div>

        <!-- Right column: Questions -->
        <div class="lg:col-span-2 space-y-4">
          <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Questions ({{ questions.length }})
          </h2>

          <div v-if="questions.length === 0" class="bg-gray-800 rounded-lg p-8 text-center text-gray-500 italic">
            No questions yet. Create one using the form.
          </div>

          <div
            v-for="q in questions"
            :key="q.id"
            class="bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <div>
              <h3 class="text-lg font-semibold text-white">{{ q.title }}</h3>
              <p v-if="q.body" class="text-sm text-gray-400 mt-1">{{ q.body }}</p>
              <p class="text-xs text-gray-600 mt-1">ID: {{ q.id }}</p>
            </div>

            <!-- Options / Votes -->
            <div v-if="q.options.length" class="space-y-2">
              <div
                v-for="opt in q.options"
                :key="opt"
                class="flex items-center justify-between bg-gray-700/50 rounded px-3 py-2"
              >
                <span class="text-sm">{{ opt }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-mono text-purple-400">{{ q.votes[opt] ?? 0 }}</span>
                  <button
                    class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition"
                    @click="vote(q.id, opt)"
                  >
                    Vote
                  </button>
                </div>
              </div>
            </div>

            <!-- Replies -->
            <div v-if="q.replies.length" class="space-y-1">
              <p class="text-xs text-gray-500 font-semibold uppercase">Replies</p>
              <div
                v-for="r in q.replies"
                :key="r.id"
                class="text-sm text-gray-300 bg-gray-700/30 rounded px-3 py-1.5"
              >
                {{ r.body }}
              </div>
            </div>

            <!-- Reply input -->
            <div class="flex gap-2">
              <input
                v-model="replyText[q.id]"
                placeholder="Write a reply..."
                class="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-purple-500"
                @keyup.enter="sendReply(q.id)"
              />
              <button
                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
                @click="sendReply(q.id)"
              >
                Reply
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>