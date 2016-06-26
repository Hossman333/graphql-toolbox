import play.sbt.PlayImport.PlayKeys._
import sbt.Keys._

playRunHooks <+= baseDirectory.map(Webpack.apply)

lazy val webpack = taskKey[Unit]("Run webpack when packaging the application")

def runWebpack(file: File) = {
  Process("./node_modules/webpack/bin/webpack", file) !
}

webpack := {
  if(runWebpack(baseDirectory.value) != 0) throw new Exception("Something goes wrong when running webpack.")
}

//dist <<= dist dependsOn webpack

//stage <<= stage dependsOn webpack