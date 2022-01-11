import * as core from '@actions/core'
import {dict, getInclude} from './leaf'
import {existsSync, readFileSync, readdirSync, statSync} from 'fs'
import {join} from 'path'

async function run(): Promise<void> {
  try {
    const changePaths: string = core.getInput('change-paths')
    const ignorePaths: string = core.getInput('ignore-paths')
    const workspace: string = core.getInput('workspace')
    const ignores = ignorePaths.split(',')
    const service = core.getInput('leaf')

    const dirs: string[] = []

    for (const e of readdirSync(workspace)) {
      if (statSync(join(workspace, e)).isDirectory() && !ignores.includes(e)) {
        dirs.push(e)
      }
    }

    const depsAll: dict = {}
    for (const pwd of dirs) {
      depsAll[pwd] = {}
      for (const p of dirs) {
        if (pwd === p) {
          continue
        }
        const settingsGradle: string = join(workspace, p, 'settings.gradle')
        if (!existsSync(settingsGradle)) {
          continue
        }
        const arr = readFileSync(settingsGradle, {encoding: 'utf-8'}).matchAll(
          /includeBuild\s'([^']+)'/g
        )
        for (const match of [...arr]) {
          const pathInclude = match[1]
          if (
            pathInclude.split('/').length > 0 &&
            pathInclude.split('/')[1] === pwd
          ) {
            depsAll[pwd][p] = {}
          }
        }
      }
    }

    const leaf: string[] = []

    for (const p of changePaths.split(',')) {
      const a = p.split('/')[0].trim()
      if (ignores.includes(a)) {
        continue
      }
      if (statSync(join(workspace, a)).isDirectory()) {
        if (Object.keys(depsAll[a]).length === 0) {
          leaf.push(a)
        } else {
          leaf.push(...getInclude(depsAll, a))
        }
      }
    }
    if (service !== '') {
      leaf.push(...service.split(','))
    }

    core.setOutput('need_ci', leaf.length > 0)
    core.setOutput('leaf', [...new Set(leaf)])
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
