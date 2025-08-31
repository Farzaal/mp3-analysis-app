pipeline {
    agent any
    environment {
       
          SONARQUBE_SERVER = 'sonarQubeJenkins' // Use the SonarQube server name configured in Jenkins
          JENKINS_URL='https://jenkins.codup.io/'
 
          NODEJS_HOME = tool name: 'oversee' // Use the name configured in Jenkins
          PATH = "${NODEJS_HOME}/bin:${env.PATH}"
           

         }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing project dependencies using npm'
                sh 'npm i yarn -g'
                sh 'yarn install'               
            }
        }


        // stage('Run Tests') {
        //      steps {
        //          echo 'Running tests'
        //          sh 'npm test'               
        //      }
        //   }

        stage('Install Build') {
               steps {
                 echo 'Building the Application'
                 sh 'npm run build'
             }
         }


        stage('SonarQube Analysis') {
             environment {
                SCANNER_HOME = tool 'SonarQube ScannerJenkins'
           }
            steps {
                echo 'Performing SonarQube analysis'
                withSonarQubeEnv('sonarQubeJenkins') {
                    sh "${SCANNER_HOME}/bin/sonar-scanner -X"
                }
            }
        }


   stage('Deploy on dev branch') {
      steps {
        echo 'testing web application'
        sh "chmod +x /var/lib/jenkins/workspace/oversee-developement/dev-deploy.sh"
        sh "/var/lib/jenkins/workspace/oversee-developement/dev-deploy.sh"
      }
    }  

        // stage("Quality Gate") {
        //     steps {
        //         script {
        //             timeout(time: 1, unit: 'HOURS') {
        //                 waitForQualityGate abortPipeline: true
  
        //             }
        //         }
        //      }
        // }

  }

post {

  //This is for googlechat 


      success {
            script {

                def message = """
                    {
                       "text": "Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}\\nCheck out the build details at: ${env.JENKINS_URL}job/${env.JOB_NAME }/${env.BUILD_NUMBER}/"
                

                 }
                """
                httpRequest acceptType: 'APPLICATION_JSON', contentType: 'APPLICATION_JSON', httpMode: 'POST', requestBody: message, url: env.GOOGLE_CHAT_WEBHOOK_URL
                     
           }
        }
  


failure {
            script {
                def message = """
                   {
                        "text": "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}\\nCheck out the build details at: ${env.JENKINS_URL}job/${env.JOB_NAME}/${env.BUILD_NUMBER}/"
                         

                   }
                """
                httpRequest acceptType: 'APPLICATION_JSON', contentType: 'APPLICATION_JSON', httpMode: 'POST', requestBody: message, url: env.GOOGLE_CHAT_WEBHOOK_URL
                 

          }
     }
   

        // always {
        //     // Ensure workspace is clean after all other actions
        //     cleanWs()
        // }


   }
}
