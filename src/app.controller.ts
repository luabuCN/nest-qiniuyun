import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as url from 'url';
import * as qiniu from 'qiniu';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIcon(@UploadedFile() file: Express.Multer.File) {
    // get token
    const mac = new qiniu.auth.digest.Mac(
      'ISVZ2etb0rHFWK9r9Kf9wmhuP6R-0sK2WN4BnXbM',
      'qLWSE62dAw-3BxSdcM5i6ONIaJufAfo5CrPKVTLJ',
    );
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: 'luabuhaiwai',
    });
    const uploadToken = putPolicy.uploadToken(mac);

    const formUploader = new qiniu.form_up.FormUploader(
      new qiniu.conf.Config({
        zone: qiniu.zone.Zone_na0,
      }),
    );

    return new Promise((resolve, reject) => {
      formUploader.put(
        uploadToken,
        `${Date.now()}-${file.originalname}`,
        file.buffer,
        new qiniu.form_up.PutExtra(),
        function (respErr, respBody, respInfo) {
          if (respErr) {
            console.error(respErr);
            return reject(new InternalServerErrorException(respErr.message));
          }
 
          if (respInfo.statusCode === 200) {
            console.log(respInfo.data.key,'当前的数据');
            try {
              const fileUrl = new url.URL(respBody.key, 'http://qnyun.20011102.xyz/').href;
              resolve({ url: fileUrl });
            } catch (urlErr) {
              console.error(urlErr);
              reject(new InternalServerErrorException(urlErr.message));
            }
          } else {
            console.error(respInfo.statusCode, respBody);
            reject(new InternalServerErrorException(respInfo));
          }
        },
      );
    });
  }
}
