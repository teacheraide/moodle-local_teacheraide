import { defineCustomElement } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'

const HelloWorldElement = defineCustomElement(HelloWorld)
const TheWelcomeElement = defineCustomElement(TheWelcome)

function init({ courseid, categoryid }: { courseid: string; categoryid: string }) {
  console.log('Hello World from teacheraide')
  console.log('hello:', courseid)
  console.log('world:', categoryid)

  // Register the custom element
  customElements.define('teacheraide-hello-world', HelloWorldElement)
  customElements.define('teacheraide-welcome', TheWelcomeElement)
}

export { init }
