#pragma once

#include <cstddef>
#include <deque>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <utility>

namespace jarvis {

template <class T>
class BoundedQueue {
 public:
  explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {
    if (capacity_ == 0) {
      throw std::invalid_argument("BoundedQueue capacity must be greater than zero");
    }
  }

  BoundedQueue(const BoundedQueue&) = delete;
  BoundedQueue& operator=(const BoundedQueue&) = delete;

  bool try_push(T value) {
    std::scoped_lock lock(mutex_);
    if (queue_.size() >= capacity_) return false;
    queue_.push_back(std::move(value));
    return true;
  }

  std::optional<T> try_pop() {
    std::scoped_lock lock(mutex_);
    if (queue_.empty()) return std::nullopt;
    T value = std::move(queue_.front());
    queue_.pop_front();
    return value;
  }

  [[nodiscard]] std::size_t size() const {
    std::scoped_lock lock(mutex_);
    return queue_.size();
  }

  [[nodiscard]] std::size_t capacity() const noexcept { return capacity_; }

 private:
  const std::size_t capacity_;
  mutable std::mutex mutex_;
  std::deque<T> queue_;
};

}  // namespace jarvis
