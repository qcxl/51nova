import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/mv',
  },
  {
    path: '/mv',
    name: 'VideoList',
    component: () => import('@/pages/video/VideoList.vue'),
  },
  {
    path: '/mv/:id',
    name: 'VideoDetail',
    component: () => import('@/pages/video/VideoDetail.vue'),
  },
  {
    path: '/picture',
    name: 'PictureHome',
    component: () => import('@/pages/picture/PictureHome.vue'),
  },
  {
    path: '/picture/:id',
    name: 'PictureDetail',
    component: () => import('@/pages/picture/PictureDetail.vue'),
  },
  {
    path: '/novel',
    name: 'NovelList',
    component: () => import('@/pages/novel/NovelList.vue'),
  },
  {
    path: '/novel/:id',
    name: 'NovelDetail',
    component: () => import('@/pages/novel/NovelDetail.vue'),
  },
  {
    path: '/novel/:id/chapter/:cid',
    name: 'NovelReader',
    component: () => import('@/pages/novel/NovelReader.vue'),
    meta: { hideHeader: true },
  },
  {
    path: '/audio',
    name: 'AudioList',
    component: () => import('@/pages/audio/AudioList.vue'),
  },
  {
    path: '/audio/:id',
    name: 'AudioDetail',
    component: () => import('@/pages/audio/AudioDetail.vue'),
  },
  {
    path: '/community',
    name: 'CommunityHome',
    component: () => import('@/pages/community/CommunityHome.vue'),
  },
  {
    path: '/community/post/:id',
    name: 'PostDetail',
    component: () => import('@/pages/community/PostDetail.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/pages/Search.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { hideHeader: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { hideHeader: true },
  },
  {
    path: '/seed',
    name: 'SeedNav',
    component: () => import('@/pages/seed/SeedNav.vue'),
  },
  {
    path: '/seed/:id',
    name: 'SeedDetail',
    component: () => import('@/pages/seed/SeedDetail.vue'),
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/pages/Tasks.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
