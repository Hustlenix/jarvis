#include "jarvis/bounded_queue.hpp"

#include <iostream>
#include <stdexcept>
#include <string>

namespace {
int require(bool condition, const char* message) {
  if (condition) return 0;
  std::cerr << "FAIL: " << message << '\n';
  return 1;
}
}  // namespace

int main() {
  bool threw = false;
  try {
    jarvis::BoundedQueue<int> invalid(0);
  } catch (const std::invalid_argument&) {
    threw = true;
  }
  if (require(threw, "zero capacity should be rejected")) return 1;

  jarvis::BoundedQueue<std::string> queue(2);
  if (require(queue.try_push("a"), "first push should succeed")) return 1;
  if (require(queue.try_push("b"), "second push should succeed")) return 1;
  if (require(!queue.try_push("c"), "push beyond capacity should fail")) return 1;
  if (require(queue.size() == 2, "size should be bounded at two")) return 1;

  const auto first = queue.try_pop();
  const auto second = queue.try_pop();
  if (require(first && *first == "a", "queue must preserve FIFO order (a)")) return 1;
  if (require(second && *second == "b", "queue must preserve FIFO order (b)")) return 1;
  if (require(!queue.try_pop().has_value(), "empty queue should return nullopt")) return 1;
  return 0;
}
