import { Injectable } from '@angular/core';
import { Conexion } from '../Interfaces/conexiones';

@Injectable({
  providedIn: 'root'
})
export class conexionesQuemadas {
     
  private readonly MOCK_CONEXIONES: Partial<Conexion>[] = [
    /*Gana*/
    //Oviedo
    {
      id: 8001,
      idPaypad: 900,
      paypad: 'Pay+ Gana Oviedo',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '629257759',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8002,
      idPaypad: 900,
      paypad: 'Pay+ Gana Oviedo',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '252272349',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Fabricato
    {
      id: 8003,
      idPaypad: 901,
      paypad: 'Pay+ Gana Fabricato',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 554 149 840',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8004,
      idPaypad: 901,
      paypad: 'Pay+ Gana Fabricato',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '653291840',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Santa Fe
    {
      id: 8005,
      idPaypad: 902,
      paypad: 'Pay+ Gana Santa Fe',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '684 468 571',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8006,
      idPaypad: 902,
      paypad: 'Pay+ Gana Santa Fe',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 679 443 993',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Niquia
    {
      id: 8007,
      idPaypad: 903,
      paypad: 'Pay+ Gana Niquia',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '928599605',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8008,
      idPaypad: 903,
      paypad: 'Pay+ Gana Niquia',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '822362974',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Molinos
    {
      id: 8009,
      idPaypad: 904,
      paypad: 'Pay+ Gana Molinos',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1023709537',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8010,
      idPaypad: 904,
      paypad: 'Pay+ Gana Molinos',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1458577154',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Parque Berrio
    {
      id: 8011,
      idPaypad: 905,
      paypad: 'Pay+ Gana Parque Berrio',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.',
      description: '1 340 753 208',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8012,
      idPaypad: 905,
      paypad: 'Pay+ Gana Parque Berrio',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '687139267',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },

    /*Apostar*/
    // VICTORIA/CUBA
    {
      id: 8013,
      idPaypad: 906,
      paypad: 'Pay+ Apostar Victoria/Cuba',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '552 303 720',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8014,
      idPaypad: 906,
      paypad: 'Pay+ Apostar Victoria/Cuba',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1101654587',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    // ARBOLEDA/AGENCIA
    {
      id: 8015,
      idPaypad: 907,
      paypad: 'Pay+ Apostar Arboleda/Agencia',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 020 118 947',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8016,
      idPaypad: 907,
      paypad: 'Pay+ Apostar Arboleda/Agencia',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.',
      description: '619 935 915',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    // Oficina Principal
    // {
    //   id: 8017,
    //   idPaypad: 908,
    //   paypad: 'Pay+ Apostar Oficina Principal',
    //   name: 'TeamViewer',
    //   userName: '',
    //   pwd: 'Ecity1234.+',
    //   description: '832 845 178',
    //   icon: '',
    //   isEditing: false,
    //   idUserCreated: 1,
    //   userCreated: 'System',
    //   dateCreated: '2024-01-01T00:00:00',
    //   idUserUpdated: 1,
    //   userUpdated: 'System',
    //   dateUpdated: '2024-01-01T00:00:00'
    // },
    {
      id: 8018,
      idPaypad: 908,
      paypad: 'Pay+ Apostar Oficina Principal',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '764786941',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },

    /*Susuerte */
    // Cable Aereo
    {
      id: 8019,
      idPaypad: 909,
      paypad: 'Pay+ Susuerte Cable Aereo',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 257 484 803',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8020,
      idPaypad: 909,
      paypad: 'Pay+ Susuerte Cable Aereo',
      name: 'AnyDesk',
      userName: '',
      pwd: 'kiosko30',
      description: '521512147',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    //Oficina Central
    {
      id: 8021,
      idPaypad: 910,
      paypad: 'Pay+ Susuerte Oficina Central',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 359 372 032',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },  
    {
      id: 8022,
      idPaypad: 910,
      paypad: 'Pay+ Susuerte Oficina Central',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '362317717',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },

    /*Facilisimo */
    // Armenia
    {
      id: 8023,
      idPaypad: 911,
      paypad: 'Pay+ Facilisimo Armenia',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 337 554 675',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8024,
      idPaypad: 911,
      paypad: 'Pay+ Facilisimo Armenia',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '952712317',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },

    /* Fincomercio */
    // Central
    {
      id: 8025,
      idPaypad: 912,
      paypad: 'Pay+ Fincomercio Central',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1 470 994 887',
      icon: 'https://astr.astridprietoarquitecta.com/293788_tiny.mp4',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8026,
      idPaypad: 912,
      paypad: 'Pay+ Fincomercio Central',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.+',
      description: '1225257435',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },

    /* Efigas */
    // Kevin Angel
    {
      id: 8027,
      idPaypad: 913,
      paypad: 'Pay+ Efigas Kevin Angel',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.',
      description: '1 901 930 643',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8028,
      idPaypad: 913,
      paypad: 'Pay+ Efigas Kevin Angel',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.',
      description: '172622330',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    // Pereira
    {
      id: 8029,
      idPaypad: 914,
      paypad: 'Pay+ Efigas Pereira',
      name: 'TeamViewer',
      userName: '',
      pwd: 'Ecity1234.',
      description: '1376736971',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    {
      id: 8030,
      idPaypad: 914,
      paypad: 'Pay+ Efigas Pereira',
      name: 'AnyDesk',
      userName: '',
      pwd: 'Ecity1234.',
      description: '653291840',
      icon: '',
      isEditing: false,
      idUserCreated: 1,
      userCreated: 'System',
      dateCreated: '2024-01-01T00:00:00',
      idUserUpdated: 1,
      userUpdated: 'System',
      dateUpdated: '2024-01-01T00:00:00'
    },
    /*  */
  ];



  getMockConexiones(): Partial<Conexion>[] {
    return [...this.MOCK_CONEXIONES];
  }


  isMockConexionId(id: number): boolean {
    return id >= 8000 && id < 9000;
  }

  /**
   * Obtener conexiones mockeadas por ID de PayPad
   */
  getMockConexionesByPaypadId(idPaypad: number): Partial<Conexion>[] {
    return this.MOCK_CONEXIONES.filter(c => c.idPaypad === idPaypad);
  }

  /**
   * Verificar si un PayPad tiene conexiones mockeadas
   */
  hasPaypadMockConexiones(idPaypad: number): boolean {
    return this.MOCK_CONEXIONES.some(c => c.idPaypad === idPaypad);
  }

}