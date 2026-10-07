import os
import tempfile
import unittest

from jarvis_zero.broker import ExecutionBroker, StructuredAction
from jarvis_zero.capabilities import CapabilitySet
from jarvis_zero.dag import TaskGraph
from jarvis_zero.model import AgentMessage, MessageType, Task, TaskStatus
from jarvis_zero.runtime import JarvisRuntime
from jarvis_zero.state import SQLiteTaskStore


class TaskGraphTests(unittest.TestCase):
    def test_dependency_gating_and_order(self):
        graph = TaskGraph()
        graph.add(Task("a", "inspect", priority=10))
        graph.add(Task("b", "build", dependencies=("a",), priority=99))
        self.assertEqual([task.task_id for task in graph.ready()], ["a"])
        graph.transition("a", TaskStatus.RUNNING)
        graph.transition("a", TaskStatus.DONE, result={"ok": True})
        self.assertEqual([task.task_id for task in graph.ready()], ["b"])

    def test_terminal_failure_propagates_block(self):
        graph = TaskGraph([Task("a", "inspect"), Task("b", "build", dependencies=("a",))])
        graph.transition("a", TaskStatus.RUNNING)
        graph.transition("a", TaskStatus.FAILED, error="boom")
        self.assertEqual(graph.get("b").status, TaskStatus.BLOCKED)

    def test_cycle_is_rejected_when_loading(self):
        with self.assertRaisesRegex(ValueError, "cycle detected"):
            TaskGraph([Task("a", "a", dependencies=("b",)), Task("b", "b", dependencies=("a",))])


class CapabilityTests(unittest.TestCase):
    def test_scoped_capability(self):
        caps = CapabilitySet(("repo.read", "repo.write:/src"))
        self.assertTrue(caps.allows("repo.read"))
        self.assertTrue(caps.allows("repo.write:/src/core/file.py"))
        self.assertFalse(caps.allows("repo.write:/docs/readme.md"))
        with self.assertRaises(ValueError):
            caps.allows("repo.write:/src/../secrets")

    def test_broker_is_deny_by_default(self):
        broker = ExecutionBroker()
        broker.register("repo.write", "repo.write:{target}", lambda action: action.target)
        with self.assertRaises(PermissionError):
            broker.execute(StructuredAction("repo.write", "/src/a.py"), CapabilitySet())
        self.assertEqual(
            broker.execute(StructuredAction("repo.write", "/src/a.py"), CapabilitySet(("repo.write:/src",))),
            "/src/a.py",
        )
        with self.assertRaises(ValueError):
            broker.register("shell.raw", "shell", lambda action: None)


class PersistenceTests(unittest.TestCase):
    def test_restart_recovers_task_state(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jarvis.sqlite3")
            store = SQLiteTaskStore(path)
            runtime = JarvisRuntime(store)
            runtime.submit(Task("a", "inspect"))
            runtime.transition("a", TaskStatus.RUNNING)
            runtime.transition("a", TaskStatus.DONE, result={"answer": 42})
            store.close()

            restored_store = SQLiteTaskStore(path)
            restored = JarvisRuntime(restored_store)
            task = restored.graph.get("a")
            self.assertEqual(task.status, TaskStatus.DONE)
            self.assertEqual(task.result, {"answer": 42})
            restored_store.close()

    def test_run_once_records_failure_without_losing_task(self):
        runtime = JarvisRuntime()
        runtime.submit(Task("a", "explode"))

        def worker(_task):
            raise RuntimeError("controlled failure")

        [finished] = runtime.run_once(worker)
        self.assertEqual(finished.status, TaskStatus.FAILED)
        self.assertIn("controlled failure", finished.error)


class ProtocolTests(unittest.TestCase):
    def test_confidence_is_validated(self):
        with self.assertRaises(ValueError):
            AgentMessage("a", "b", "t", MessageType.RESULT, {}, confidence=1.5)


if __name__ == "__main__":
    unittest.main()
