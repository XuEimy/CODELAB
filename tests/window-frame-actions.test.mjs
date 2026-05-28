import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')
const appPath = path.join(projectRoot, 'public', 'app.html')

test('window frame keeps four standard action slots for every workbench window', () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.match(
    html,
    /function buildWinFrameHtml\(instanceId,def\)\{[\s\S]*?<button class="fw-btn" onclick="openShareFromWin\('\$\{instanceId\}'\)" title="共享">/u,
  )
  assert.match(
    html,
    /function buildWinFrameHtml\(instanceId,def\)\{[\s\S]*?<button class="fw-btn" onclick="createNewInstance\('\$\{def\.id\}'\)" title="\+新建">&#43;<\/button>/u,
  )
  assert.match(
    html,
    /function buildWinFrameHtml\(instanceId,def\)\{[\s\S]*?<button class="fw-btn fw-btn-min" onclick="toggleMinimize\('\$\{instanceId\}'\)" title="最小化">&#9472;<\/button>/u,
  )
  assert.match(
    html,
    /function buildWinFrameHtml\(instanceId,def\)\{[\s\S]*?<button class="fw-btn close" onclick="hideWin\('\$\{instanceId\}'\)" title="关闭">&#10005;<\/button>/u,
  )
  assert.doesNotMatch(html, /const plusBtn=isShared\?'':/u)
})
