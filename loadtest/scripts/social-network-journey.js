import { check, sleep } from "k6";
import { ApiClient } from "../lib/api-client.js";
import {
  options as configOptions,
  BASE_URL,
} from "../social-network.config.js";

export const options = configOptions;

const apiClient = new ApiClient(BASE_URL);

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isSuccess(r) {
  return r.status === 200 || r.status === 201;
}

export default function () {
  const uniqueId = `user_${__VU}_${__ITER}_${randomString(4)}`;
  const email = `${uniqueId}@example.com`;
  const password = "Password123!";

  // --- 1. Dynamic Registration & Login (Step 1) ---
  // In Option A, each new VU/Iteration flow starts with registration
  const regRes = apiClient.register(
    email,
    password,
    `First_${uniqueId}`,
    "Lastname",
  );
  check(regRes, { "registration successful": isSuccess });

  // Wait several seconds before going from write to read operation
  sleep(3);

  const loginRes = apiClient.login(email, password);
  if (!check(loginRes, { "login successful": isSuccess })) {
    return; // Stop if login fails
  }

  const token = loginRes.json("data.accessToken");
  if (!token) return;

  // --- 2. Random User Activity (Probabilistic) ---
  // We simulate a user sticking around for multiple actions
  const totalActions = Math.floor(Math.random() * 5) + 3; // 3 to 8 actions per session

  for (let i = 0; i < totalActions; i++) {
    const rand = Math.random();

    if (rand < 0.5) {
      // --- Feed & Browsing Flow (50%) ---
      const postsRes = apiClient.getPosts(token);
      check(postsRes, { "got feed": isSuccess });

      // Pick a random user to view profile (if found in feed)
      try {
        const posts = postsRes.json("posts");
        if (posts && posts.length > 0) {
          const randomPost = posts[Math.floor(Math.random() * posts.length)];
          const profileRes = apiClient.getUserProfile(
            token,
            randomPost.authorId,
          );
          check(profileRes, { "got author profile": isSuccess });
        }
      } catch (e) {}
    } else if (rand < 0.75) {
      // --- Engagement Flow (25%) ---
      // 50% chance to Create Post, 50% chance to Like Post
      if (Math.random() < 0.5) {
        const createRes = apiClient.createPost(
          token,
          `Hello world from ${uniqueId}! This is a load test.`,
        );
        check(createRes, { "post created": isSuccess });
        sleep(3); // Wait after write
      } else {
        // Get feed first to find a post to like
        const postsRes = apiClient.getPosts(token);
        try {
          const posts = postsRes.json("posts");
          if (posts && posts.length > 0) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            const likeRes = apiClient.likePost(token, randomPost.id);
            check(likeRes, {
              "post liked": isSuccess,
            });
            sleep(3); // Wait after write
          }
        } catch (e) {}
      }
    } else if (rand < 0.9) {
      // --- Messaging Flow (15%) ---
      apiClient.getConversations(token);

      // Fetch feed to find someone to message
      const postsRes = apiClient.getPosts(token);
      try {
        const posts = postsRes.json("posts");
        if (posts && posts.length > 0) {
          const randomPost = posts[Math.floor(Math.random() * posts.length)];
          if (randomPost.authorId !== uniqueId) {
            const msgRes = apiClient.sendMessage(
              token,
              randomPost.authorId,
              `DMed you from ${uniqueId}!`,
            );
            check(msgRes, { "message sent": isSuccess });
            sleep(3); // Wait after write
          }
        }
      } catch (e) {}
    } else {
      // --- Other / Search flow (10%) ---
      const searchRes = apiClient.searchUsers(token, "user");
      check(searchRes, { "search results ok": isSuccess });
    }

    // Think time between actions (1-3 seconds)
    sleep(Math.random() * 2 + 1);
  }
}
