cmake_minimum_required(VERSION 3.20)
project(jarvis_native LANGUAGES CXX)

add_library(jarvis_native INTERFACE)
target_include_directories(jarvis_native INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_features(jarvis_native INTERFACE cxx_std_20)

if(MSVC)
  target_compile_options(jarvis_native INTERFACE /W4 /permissive-)
else()
  target_compile_options(jarvis_native INTERFACE -Wall -Wextra -Wpedantic -Werror)
endif()

enable_testing()
add_executable(bounded_queue_test tests/bounded_queue_test.cpp)
target_link_libraries(bounded_queue_test PRIVATE jarvis_native)
add_test(NAME bounded_queue_test COMMAND bounded_queue_test)
