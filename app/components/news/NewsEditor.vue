<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface Props {
  /** HTML контент редактора */
  modelValue: string
}

const props = defineProps<Props>()

// ═══════════════════════════════════════════════════════════════════════════
// EMITS
// ═══════════════════════════════════════════════════════════════════════════
const emit = defineEmits<{
  /** Обновление контента */
  'update:modelValue': [value: string]
}>()

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline',
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
    },
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Добавить ссылку через prompt */
function addLink() {
  const url = window.prompt('URL ссылки:')
  if (!url || !editor.value) return

  editor.value.chain().focus().setLink({ href: url }).run()
}

/** Удалить ссылку с выделенного текста */
function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
}

// ═══════════════════════════════════════════════════════════════════════════
// WATCH
// ═══════════════════════════════════════════════════════════════════════════

// Синхронизация контента при внешнем изменении modelValue
watch(() => props.modelValue, (value) => {
  if (!editor.value || editor.value.getHTML() === value) return

  editor.value.commands.setContent(value)
})
</script>

<template>
  <div class="news-editor glass-card rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="toolbar flex flex-wrap gap-2 p-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
      <button
        :class="{ 'bg-primary/20': editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
        type="button"
        title="Полужирный"
        class="toolbar-btn"
      >
        <Icon name="heroicons:bold" class="w-4 h-4" />
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
        type="button"
        title="Курсив"
        class="toolbar-btn"
      >
        <span class="italic font-serif">I</span>
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('heading', { level: 2 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        type="button"
        title="Заголовок 2"
        class="toolbar-btn"
      >
        H2
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('heading', { level: 3 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        type="button"
        title="Заголовок 3"
        class="toolbar-btn"
      >
        H3
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()"
        type="button"
        title="Маркированный список"
        class="toolbar-btn"
      >
        <Icon name="heroicons:list-bullet" class="w-4 h-4" />
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()"
        type="button"
        title="Нумерованный список"
        class="toolbar-btn"
      >
        <span class="text-xs font-bold">1.</span>
      </button>

      <button
        :class="{ 'bg-primary/20': editor?.isActive('link') }"
        @click="addLink"
        type="button"
        title="Добавить ссылку"
        class="toolbar-btn"
      >
        <Icon name="heroicons:link" class="w-4 h-4" />
      </button>

      <button
        v-if="editor?.isActive('link')"
        @click="removeLink"
        type="button"
        title="Удалить ссылку"
        class="toolbar-btn"
      >
        <Icon name="heroicons:link-slash" class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.toolbar-btn {
  @apply px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors;
}

:deep(.ProseMirror) {
  color: var(--text-primary);
}

:deep(.ProseMirror p) {
  margin-bottom: 1rem;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  color: var(--text-primary);
}

:deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
  color: var(--text-primary);
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 2rem;
  margin-bottom: 1rem;
}

:deep(.ProseMirror ul) {
  list-style: disc;
}

:deep(.ProseMirror ol) {
  list-style: decimal;
}

:deep(.ProseMirror a) {
  color: var(--primary);
  text-decoration: underline;
}
</style>
