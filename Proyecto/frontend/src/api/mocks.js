// Mocks basados exactamente en Proyecto/contracts/examples/

const savedMockUser = typeof window !== 'undefined' ? localStorage.getItem('mock_user') : null;
let mockCurrentUser = savedMockUser ? JSON.parse(savedMockUser) : {
  id: 3,
  username: "ana",
  fullName: "Ana López",
  email: "ana@example.com",
  dpi: "1234567890101",
  photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  createdAt: "2026-10-24T15:00:00Z"
};

let lastUploadedProfilePhotoUrl = null;
let lastUploadedPostPhotoUrl = null;

function saveMockUser(user) {
  mockCurrentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_user', JSON.stringify(user));
  }
}

let mockPosts = [
  {
    id: 12,
    author: {
      id: 3,
      username: "ana",
      fullName: "Ana López",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    description: "Hermoso día en el campus de la facultad disfrutando el sol y preparando proyectos.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    labels: ["Beach", "Outdoors", "Sea", "Campus"],
    commentCount: 2,
    createdAt: "2026-10-24T15:30:00Z"
  },
  {
    id: 11,
    author: {
      id: 8,
      username: "lucia",
      fullName: "Lucía Gómez",
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
    },
    description: "Terminando la práctica de Seminario de Sistemas con balanceador y AWS.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    labels: ["Technology", "Computer", "Engineering"],
    commentCount: 1,
    createdAt: "2026-10-24T14:15:00Z"
  }
];

let mockComments = {
  12: [
    {
      id: 40,
      postId: 12,
      author: {
        id: 8,
        username: "lucia",
        fullName: "Lucía Gómez",
        photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
      },
      text: "¡Qué buena foto Ana! Éxitos en el semestre.",
      createdAt: "2026-10-24T15:40:00Z"
    },
    {
      id: 41,
      postId: 12,
      author: {
        id: 5,
        username: "luis",
        fullName: "Luis Pérez",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
      },
      text: "¡Genial, nos vemos en el T-3!",
      createdAt: "2026-10-24T16:00:00Z"
    }
  ],
  11: [
    {
      id: 42,
      postId: 11,
      author: {
        id: 3,
        username: "ana",
        fullName: "Ana López",
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
      },
      text: "¡Felicidades Lucía, gran avance!",
      createdAt: "2026-10-24T14:30:00Z"
    }
  ]
};

let mockFriends = [
  {
    id: 8,
    username: "lucia",
    fullName: "Lucía Gómez",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
  }
];

let mockDiscoverUsers = [
  {
    id: 5,
    username: "luis",
    fullName: "Luis Pérez",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    requestStatus: "none"
  },
  {
    id: 9,
    username: "carlos",
    fullName: "Carlos Martínez",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    requestStatus: "none"
  }
];

let mockFriendRequests = {
  received: [
    {
      id: 11,
      fromUser: {
        id: 7,
        username: "esteban",
        fullName: "Esteban Quiroa",
        photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
      },
      toUser: mockCurrentUser,
      status: "pending",
      createdAt: "2026-10-24T14:00:00Z"
    }
  ],
  sent: [
    {
      id: 14,
      fromUser: mockCurrentUser,
      toUser: {
        id: 5,
        username: "luis",
        fullName: "Luis Pérez",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
      },
      status: "pending",
      createdAt: "2026-10-24T15:10:00Z"
    }
  ]
};

let mockMessages = {
  8: [
    { id: 90, fromUserId: 8, toUserId: 3, text: "¿Cómo vas con la práctica de AWS?", createdAt: "2026-10-24T15:30:30Z" },
    { id: 91, fromUserId: 3, toUserId: 8, text: "¡Todo listo! Configurando Cognito y el bot de Lex.", createdAt: "2026-10-24T15:31:00Z" }
  ]
};

export async function handleMockRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
  const pathname = url.split('?')[0];
  const query = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');

  console.log(`[MOCK API] ${method} ${url}`, body);

  // Simular latencia de red
  await new Promise(r => setTimeout(r, 200));

  // /api/health
  if (pathname.endsWith('/api/health')) {
    return {
      status: "success",
      message: "Servicio saludable",
      data: { runtime: "node-mock", instance: "ec2-local" }
    };
  }

  // POST /upload/profile
  if (pathname.endsWith('/upload/profile') && method === 'POST') {
    const raw = body.imageBase64 || '';
    const formattedUrl = raw.startsWith('data:') 
      ? raw 
      : (raw ? `data:image/jpeg;base64,${raw}` : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200");
    lastUploadedProfilePhotoUrl = formattedUrl;
    return {
      status: "success",
      message: "Imagen subida",
      data: {
        key: `Fotos_Perfil/mock-${Date.now()}.jpg`,
        url: formattedUrl
      }
    };
  }

  // POST /upload/post
  if (pathname.endsWith('/upload/post') && method === 'POST') {
    const raw = body.imageBase64 || '';
    const formattedUrl = raw.startsWith('data:')
      ? raw
      : (raw ? `data:image/jpeg;base64,${raw}` : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");
    lastUploadedPostPhotoUrl = formattedUrl;
    return {
      status: "success",
      message: "Imagen subida",
      data: {
        key: `Fotos_Publicadas/mock-${Date.now()}.jpg`,
        url: formattedUrl,
        labels: ["Campus", "USAC", "Engineering", "Technology", "Outdoors"]
      }
    };
  }

  // POST /api/auth/register
  if (pathname.endsWith('/api/auth/register') && method === 'POST') {
    const newUser = {
      id: Date.now(),
      username: body.username || "nuevo_usuario",
      fullName: body.fullName || "Estudiante USAC",
      email: body.email,
      dpi: body.dpi,
      photoUrl: lastUploadedProfilePhotoUrl || body.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      createdAt: new Date().toISOString()
    };
    saveMockUser(newUser);
    return {
      status: "success",
      message: "Usuario registrado. Revisa tu correo para verificar la cuenta.",
      data: { user: newUser }
    };
  }

  // POST /api/auth/session
  if (pathname.endsWith('/api/auth/session') && method === 'POST') {
    return {
      status: "success",
      message: "Sesión iniciada",
      data: {
        token: "mock-jwt-token-session-" + Date.now(),
        user: mockCurrentUser
      }
    };
  }

  // POST /api/auth/face-session
  if (pathname.endsWith('/api/auth/face-session') && method === 'POST') {
    return {
      status: "success",
      message: "Sesión iniciada correctamente por biometría facial",
      data: {
        token: "mock-jwt-face-session-" + Date.now(),
        user: mockCurrentUser
      }
    };
  }

  // GET /api/users/me
  if (pathname.endsWith('/api/users/me') && method === 'GET') {
    return {
      status: "success",
      message: "Perfil obtenido",
      data: mockCurrentUser
    };
  }

  // PUT /api/users/me
  if (pathname.endsWith('/api/users/me') && method === 'PUT') {
    const updated = {
      ...mockCurrentUser,
      fullName: body.fullName || mockCurrentUser.fullName,
      dpi: body.dpi || mockCurrentUser.dpi,
      photoUrl: lastUploadedProfilePhotoUrl || body.photoUrl || mockCurrentUser.photoUrl
    };
    saveMockUser(updated);
    return {
      status: "success",
      message: "Perfil actualizado correctamente",
      data: updated
    };
  }

  // GET /api/users/discover
  if (pathname.endsWith('/api/users/discover') && method === 'GET') {
    const q = (query.get('q') || '').toLowerCase();
    const filtered = mockDiscoverUsers.filter(u => 
      !q || u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)
    );
    return {
      status: "success",
      message: "Usuarios obtenidos",
      data: filtered
    };
  }

  // POST /api/friends/requests
  if (pathname.endsWith('/api/friends/requests') && method === 'POST') {
    const toUser = mockDiscoverUsers.find(u => u.id === Number(body.toUserId)) || {
      id: body.toUserId,
      username: "usuario_" + body.toUserId,
      fullName: "Compañero USAC"
    };
    const req = {
      id: Date.now(),
      fromUser: mockCurrentUser,
      toUser,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    mockFriendRequests.sent.push(req);
    return {
      status: "success",
      message: "Solicitud enviada",
      data: req
    };
  }

  // GET /api/friends/requests
  if (pathname.endsWith('/api/friends/requests') && method === 'GET') {
    return {
      status: "success",
      message: "Solicitudes obtenidas",
      data: mockFriendRequests
    };
  }

  // PUT /api/friends/requests/:id
  if (pathname.includes('/api/friends/requests/') && method === 'PUT') {
    const reqId = Number(pathname.split('/').pop());
    const action = body.action || 'accept';
    const foundIdx = mockFriendRequests.received.findIndex(r => r.id === reqId);
    
    if (foundIdx !== -1) {
      const item = mockFriendRequests.received[foundIdx];
      mockFriendRequests.received.splice(foundIdx, 1);
      if (action === 'accept') {
        mockFriends.push(item.fromUser);
      }
      return {
        status: "success",
        message: action === 'accept' ? "Solicitud aceptada" : "Solicitud rechazada",
        data: { ...item, status: action === 'accept' ? 'accepted' : 'rejected' }
      };
    }
    return {
      status: "success",
      message: "Solicitud procesada",
      data: { id: reqId, status: action }
    };
  }

  // GET /api/friends
  if (pathname.endsWith('/api/friends') && method === 'GET') {
    return {
      status: "success",
      message: "Amigos obtenidos",
      data: mockFriends
    };
  }

  // GET /api/posts
  if (pathname.endsWith('/api/posts') && method === 'GET') {
    const tag = query.get('tag');
    let filtered = mockPosts;
    if (tag && tag !== 'Todos') {
      filtered = mockPosts.filter(p => (p.labels || []).includes(tag));
    }
    return {
      status: "success",
      message: "Publicaciones obtenidas",
      data: filtered
    };
  }

  // POST /api/posts
  if (pathname.endsWith('/api/posts') && method === 'POST') {
    const newPost = {
      id: Date.now(),
      author: {
        id: mockCurrentUser.id,
        username: mockCurrentUser.username,
        fullName: mockCurrentUser.fullName,
        photoUrl: mockCurrentUser.photoUrl
      },
      description: body.description || "",
      imageUrl: lastUploadedPostPhotoUrl || body.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      labels: body.labels || ["General"],
      commentCount: 0,
      createdAt: new Date().toISOString()
    };
    mockPosts.unshift(newPost);
    return {
      status: "success",
      message: "Publicación creada con éxito",
      data: newPost
    };
  }

  // GET /api/tags
  if (pathname.endsWith('/api/tags') && method === 'GET') {
    const q = (query.get('q') || '').toLowerCase();
    const tagMap = {};
    mockPosts.forEach(p => {
      (p.labels || []).forEach(l => {
        tagMap[l] = (tagMap[l] || 0) + 1;
      });
    });
    let list = Object.entries(tagMap).map(([name, count]) => ({ name, count }));
    if (q) {
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return {
      status: "success",
      message: "Etiquetas obtenidas",
      data: list
    };
  }

  // GET /api/posts/:id/comments
  if (pathname.match(/\/api\/posts\/\d+\/comments/) && method === 'GET') {
    const postId = Number(pathname.split('/')[3]);
    return {
      status: "success",
      message: "Comentarios obtenidos",
      data: mockComments[postId] || []
    };
  }

  // POST /api/posts/:id/comments
  if (pathname.match(/\/api\/posts\/\d+\/comments/) && method === 'POST') {
    const postId = Number(pathname.split('/')[3]);
    const comment = {
      id: Date.now(),
      postId,
      author: {
        id: mockCurrentUser.id,
        username: mockCurrentUser.username,
        fullName: mockCurrentUser.fullName,
        photoUrl: mockCurrentUser.photoUrl
      },
      text: body.text || "",
      createdAt: new Date().toISOString()
    };
    if (!mockComments[postId]) mockComments[postId] = [];
    mockComments[postId].push(comment);

    // Actualizar commentCount del post
    const post = mockPosts.find(p => p.id === postId);
    if (post) post.commentCount = (post.commentCount || 0) + 1;

    return {
      status: "success",
      message: "Comentario publicado",
      data: comment
    };
  }

  // POST /api/translate
  if (pathname.endsWith('/api/translate') && method === 'POST') {
    const targetLang = body.targetLang || 'en';
    const text = body.text || '';
    
    const dictionary = {
      en: {
        "Fin de semana": "Weekend",
        "Hermoso día en el campus de la facultad disfrutando el sol y preparando proyectos.": "Beautiful day on campus enjoying the sunshine and preparing projects.",
        "Terminando la práctica de Seminario de Sistemas con balanceador y AWS.": "Finishing the Systems Seminar project with load balancer and AWS.",
        "¡Qué buena foto Ana! Éxitos en el semestre.": "Great photo Ana! Wishing you success this semester.",
        "¡Genial, nos vemos en el T-3!": "Awesome, see you at T-3 building!",
        "¡Felicidades Lucía, gran avance!": "Congratulations Lucía, great progress!"
      },
      fr: {
        "Fin de semana": "Fin de semaine",
        "Hermoso día en el campus de la facultad disfrutando el sol y preparando proyectos.": "Belle journée sur le campus à profiter du soleil et à préparer des projets.",
        "Terminando la práctica de Seminario de Sistemas con balanceador y AWS.": "Fin du projet de Séminaire Systèmes avec équilibreur et AWS."
      },
      pt: {
        "Fin de semana": "Fim de semana",
        "Hermoso día en el campus de la facultad disfrutando el sol y preparando proyectos.": "Lindo dia no campus aproveitando o sol e preparando projetos.",
        "Terminando la práctica de Seminario de Sistemas con balanceador y AWS.": "Finalizando o projeto de Seminário de Sistemas com balanceador e AWS."
      },
      es: {
        "Weekend": "Fin de semana",
        "Hello world": "Hola mundo"
      }
    };

    const translatedText = dictionary[targetLang]?.[text] || `[Traducción (${targetLang})]: ${text}`;

    return {
      status: "success",
      message: "Texto traducido",
      data: {
        translatedText,
        sourceLang: "auto",
        targetLang
      }
    };
  }

  // GET /api/chat/:friendId/messages
  if (pathname.match(/\/api\/chat\/\d+\/messages/) && method === 'GET') {
    const friendId = Number(pathname.split('/')[3]);
    return {
      status: "success",
      message: "Mensajes obtenidos",
      data: mockMessages[friendId] || []
    };
  }

  return {
    status: "error",
    message: `Endpoint mock no implementado para ${method} ${pathname}`,
    data: { code: "NOT_FOUND" }
  };
}
